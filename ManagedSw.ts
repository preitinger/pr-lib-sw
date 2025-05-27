import assert from "assert";
import { TVersion, versionToString } from "../pr-lib-sw-utils/sw-utils";
import { TSkipWaiting } from "../pr-lib-sw-utils/messages";

export type ManagedSwState = 'starting' | 'updating-at-start' | 'running' | 'version-conflict' | 'updating' | 'error';

export type ManagedSwEvent = {
    type: 'stateChanged'
};

export type ManagedSwListener = (e: ManagedSwEvent) => void;

export default class ManagedSw {
    constructor(scriptURL: string | URL, scope: string) {
        dbg('constructor of ManagedSw');
        if (!(typeof window === 'object' && 'navigator' in window && typeof window.navigator === 'object' && 'serviceWorker' in window.navigator)) {
            throw new Error('Service worker not supported.');
        }
        navigator.serviceWorker.oncontrollerchange = () => {
            dbg('oncontrollerchange');
            this.setState('reloading-at-start');
            this.reload();
        }

        navigator.serviceWorker.register(scriptURL, { scope }).then(
            reg => {
                this._reg = reg;
                dbg('after register.', reg);
                this.setState('updating-at-start');
                reg.update().then(() => {
                    dbg('after update', reg);

                    if (reg.installing) {
                        reg.installing.onstatechange = () => {
                            if (reg.waiting) {
                                this.skipWaiting(reg.waiting);
                                this.setState('activating-at-start');

                            }
                        }
                        this.setState('installing-at-start');
                    } else if (reg.waiting) {
                        this.skipWaiting(reg.waiting);
                    } else {
                        assert(reg.active);
                        reg.onupdatefound = () => {
                            this.onUpdateFound();
                        }
                        navigator.serviceWorker.oncontrollerchange = () => {
                            this.setState('reloading');
                            this.reload();
                        }
                        this.setState('active');
                    }
                }).catch((reason) => {
                    if (reason.name === 'TypeError') {
                        console.log('ignore TypeError in reg.update() because offline mode is ok at start');
                        this.setState('active');
                    }
                })
            }
        )
    }

    update() {
        if (this._reg == null) {
            // updating at start, anyway; quit here
            return;
        }

        this._reg.update();
    }

    get state(): ManagedSwState {
        switch (this._state) {
            case 'registering':
            // no break
            case 'updating-at-start':
                return this._versionConflict == null ? 'starting' : 'version-conflict';
            case 'installing-at-start':
            // no break
            case 'activating-at-start':
            // no break
            case 'reloading-at-start':
                return 'updating-at-start';
            case 'updating':
                // no break
            case 'installing':
                return (this._skipWaiting) ? 'updating' : 'version-conflict';
            case 'awaiting-user-confirmation':
                return 'version-conflict';
            case 'activating':
                // no break
            case 'reloading':
                return 'updating';
            case 'active':
                return 'running';
            case 'error':
                return 'error';
        }
    }

    get updateAvailable(): string | null {
        if (this._versionConflict == null) return null;
        return versionToString(this._versionConflict.client) + ' -> ' + versionToString(this._versionConflict.server);
    }

    addListener(l: ManagedSwListener) {
        this.listeners.push(l);
    }
    
    removeListener(l: ManagedSwListener) {
        const n = this.listeners.length;
        for (let i = 0; i < n ;++i) {
            if (this.listeners[i] === l) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    }

    versionConflict(client: TVersion, server: TVersion) {
        this._versionConflict = {
            client,
            server
        }

        switch (this._state) {
            case 'active':
                assert(this._reg);
                navigator.serviceWorker.oncontrollerchange = () => {
                    switch (this._state) {
                        case 'activating':
                            this.setState('reloading');
                            this.reload();
                            break;
                        default:
                            console.error('oncontrollerchange in intern state', this._state);
                            break;
                    }
                }
                this.setState('updating');
                this._reg.update().then(() => {
                    assert(this._reg);
                    if (this._reg.installing) {
                        this.setState('installing');
                        const installing = this._reg.installing;
                        assert(installing.state === 'installing');
                        installing.onstatechange = () => {
                            // dbg('onstatechange: current state of worker', installing.state, 'this._skipWaiting', this._skipWaiting);
                            if (installing.state === 'installed') {
                                assert(this._reg?.waiting === installing);
                                if (this._skipWaiting) {
                                    this.skipWaiting(installing);
                                    this.setState('activating');
                                } else {
                                    this.setState('awaiting-user-confirmation');
                                }
                            }

                        }
                    } else if (this._reg.waiting) {
                        if (this._skipWaiting) {
                            this.skipWaiting(this._reg.waiting);
                            this.setState('activating');
                        } else {
                            this.setState('awaiting-user-confirmation');
                        }
                    } else {
                        console.error('Version conflict, but no update found for sw. Please try to reload manually somehow');
                    }
                }).catch((reason) => {
                    console.error('caught in update - probably no network connection', reason);
                    this.setState('error');

                });
                break;
        }
    }

    updateNow() {
        dbg('updateNow in state', this._state);

        switch (this._state) {
            case 'updating':
                // no break
            case 'installing':
                this._skipWaiting = true;
                this.fireChange();
                break;
            case 'awaiting-user-confirmation':
                if (this._reg?.waiting != null) {
                    this.skipWaiting(this._reg.waiting);
                    this.setState('activating');
                }
                break;
            default:
                console.warn('updateNow in intern state', this._state);
                break;
        }
    }

    private fireChange() {
        for (const l of this.listeners) {
            l({
                type: 'stateChanged'
            });
        }
    }

    private setState(s: State) {
        this._state = s;
        dbg('new state', s);
        this.fireChange();
    }

    private skipWaiting(w: ServiceWorker) {
        const req: TSkipWaiting = {
            type: 'skipWaiting'
        }
        w.postMessage(req);

    }

    private onUpdateFound() {
        dbg('onUpdateFound: this._reg', this._reg);
    }

    private reload() {
        if (this.reloading) return;
        this.reloading = true;
        dbg('gonna reload');
        window.location.reload();
    }

    private _state: State = 'registering';
    private listeners: ManagedSwListener[] = [];
    private _reg: ServiceWorkerRegistration | null = null;
    private reloading = false;
    private _skipWaiting = false;
    private _versionConflict: VersionConflict | null = null;
}

/**
 * private state (non-public)
 */
type State = 'registering' | 'updating-at-start' | 'installing-at-start' |
    'activating-at-start' | 'reloading-at-start' | 'active' |
    'updating' | 'installing' | 'awaiting-user-confirmation' | 'activating' | 'reloading' | 'error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dbg(...args: unknown[]) {
    console.error('ManagedSw.dbg(7)  ', ...args);
}

type VersionConflict = {
    client: TVersion;
    server: TVersion;
}
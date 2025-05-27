import assert from "assert";
import { TSkipWaiting } from "../pr-lib-sw-utils/messages";

// export let swCheckingRaw = true;
// const swCheckingListeners: (() => void)[] = [];
// let reloading = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbg(...args: any[]) {
    // console.error('FILTER ', ...args);
    console.debug(...args);
}

type InternState = {
    checking: boolean;
    reloading: boolean;
    checkingListeners: (() => void)[];
}

export class SwInitState {
    private _state: InternState;

    constructor(state: InternState) {
        this._state = state;
    }

    /**
     * becomes true as long as the initialization process is ongoing
     */
    get checking(): boolean {
        return this._state.checking;
    }
    get reloading(): boolean {
        return this._state.reloading;
    }

    /**
     * adds `l` to the list of functions that will be called
     * when this.checking() has become false.
     * @param l the listener to add
     */
    addCheckingListener(l: () => void) {
        this._state.checkingListeners.push(l);
    }
    
    /**
     * removes `l` from the list of functions that will be called
     * when this.checking() has become false.
     * @param l the listener to be removed
     */
    removeCheckingListener(l: () => void) {
        const idx = this._state.checkingListeners.indexOf(l);
        if (idx === -1) return;
        this._state.checkingListeners.splice(idx, 1);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function sw_init(scriptURL: string | URL, scope: string): [state: SwInitState, Promise<void>] {
    const state: InternState = {
        checking: true,
        reloading: false,
        checkingListeners: [],
    }

    return [new SwInitState(state), new Promise((res, rej) => {
        if (typeof window === 'object' && 'serviceWorker' in window.navigator) {
            // function onMessage(e: MessageEvent) {
            //     console.debug('received message', e, 'with data', e.data);
            //     if (GetVersionRes.guard(e.data)) {
            //         switch (e.data.type) {
            //             case 'success':
            //                 res(e.data.version);
            //                 break;
            //         }
            //     }
            // }
            // // setSwState('sw registering')
            // navigator.serviceWorker.addEventListener('message', onMessage);

            navigator.serviceWorker.oncontrollerchange = () => {
                dbg('[1] oncontrollerchange');
                if (!state.reloading) {
                    state.reloading = true;
                    window.location.reload();
                }
            }

            dbg('[1] before serviceWorker.register');
            window.navigator.serviceWorker.register(scriptURL, {
                scope
            }).then((reg) => {
                dbg('[1] after serviceWorker.register: reg', reg);
                dbg('[1] reg.active', reg.active);
                dbg('[1] reg.waiting', reg.waiting);
                dbg('[1] reg.installing', reg.installing);
                reg.onupdatefound = (e) => {
                    dbg('[1] onupdatefound - do nothing now', e);
                };


                ////////////
                reg.onupdatefound = (e) => {
                    dbg('onupdatefound', e);
                }
                reg.update().then(() => {
                    dbg('after update');
                    dbg('active', reg.active, 'installing', reg.installing, 'waiting', reg.waiting);
                    if (reg.installing) {
                        const installing = reg.installing;
                        assert(!reg.waiting);
                        installing.onstatechange = () => {
                            dbg('onstatechange: installing', installing);
                            if (reg.waiting) {
                                const req: TSkipWaiting = {
                                    type: 'skipWaiting'
                                }
                                reg.waiting.postMessage(req)
                                dbg('sent skipWaiting to SW');
                            } else if (installing.state === 'activated') {
                                if (!state.reloading) {
                                    state.reloading = true;
                                    alert('Reload commented out! - Do it manually, now!');
                                    // window.location.reload();
                                } else {
                                    dbg('Already reloading - doing nothing.');
                                }
                            }
                        }
                    } else if (reg.waiting) {
                        const req: TSkipWaiting = {
                            type: 'skipWaiting'
                        }
                        reg.waiting.postMessage(req)
                        dbg('sent skipWaiting to SW');
                    } else {
                        if (reg.active == null) {
                            // TODO throw error or other feedback for failing to register the sw
                            rej(new Error('Neither installing, nor waiting, nor active serviceWorker after successful update() is unexpected!'));
                            return;
                        }

                        state.checking = false;
                        dbg("[1] swChecking = false");
                        for (const l of state.checkingListeners) {
                            l();
                        }
                        res();
                    }
                })
            }).catch(reason => {
                console.error(reason);
                rej(reason);
                // window.navigator.serviceWorker.getRegistration().then(reg => {
                //     if (reg != null) {
                //         sendGetVersion(reg);
                //     }
                // })
            });
        } else {
            console.debug('window no object probably server rendering');
        }

    })]

}

'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import ManagedSw, { ManagedSwListener, TUpdateAvailable } from '../ManagedSw';
import { TVersion } from "../../pr-lib-sw-utils/sw-utils";

export type UpdateForNavbarProps = {
    swChecking: boolean,
    updatingAtStart: boolean,
    updateAvailable: TUpdateAvailable | null;
    updateSpinning: boolean;
    onUpdateNow(): void;
}

export default function useSw(/* l: I18nRequiredForDoRequest & UtilsClArg */): [
    setManagedSw: (managedSw: ManagedSw) => void,
    onVersionConflict: (client: TVersion, server: TVersion) => void,
    updateForNavbarProps: UpdateForNavbarProps,
] {
    const [swChecking, setSwChecking] = useState(true);
    const [updatingAtStart, setUpdatingAtStart] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState<TUpdateAvailable | null>(null);
    const [updateSpinning, setUpdateSpinning] = useState(false);

    const managedSwRef = useRef<ManagedSw | null>(null);

    useEffect(() => {
        setSwChecking(true);
    }, [])

    const setManagedSw = useCallback((managedSw: ManagedSw) => {
        function updateInternState() {
            switch (managedSwRef.current?.state) {
                case 'updating-at-start':
                    setSwChecking(true);
                    setUpdatingAtStart(true);
                    break;
                case 'version-conflict':
                    setSwChecking(false);
                    setUpdateAvailable(managedSwRef.current.updateAvailable);
                    break;
                case 'updating':
                    setSwChecking(false);
                    setUpdateSpinning(true);
                    break;
                case 'running':
                    setSwChecking(false);
                    setUpdateSpinning(false);
                    setUpdateAvailable(null);
                    break;
                case 'starting':
                    setSwChecking(true);
                    setUpdateAvailable(null);
                    setUpdateSpinning(false);
                    break;
            }
        }

        const listener: ManagedSwListener = (e) => {
            if (managedSwRef.current == null) {
                console.log('setManagedSw callback: managedSwRef.current null');
                setSwChecking(true);
                return;
            }

            switch (e.type) {
                case 'stateChanged':
                    console.log('useSw: new state', managedSwRef.current?.state);
                    updateInternState();
                    break;
            }
        }
        if (managedSwRef.current != null) {
            managedSwRef.current.removeListener(listener);
        }
        managedSwRef.current = managedSw;
        managedSw.addListener(listener);
        updateInternState();
    }, [])

    const onVersionConflict = useCallback((client: TVersion, server: TVersion) => {
        if (managedSwRef.current == null) {
            console.error('onVersionConflict when managedSwRef.current null');
            return;
        }
        managedSwRef.current.versionConflict(client, server)
    }, [])

    const onUpdateNow = useCallback(() => {
        if (managedSwRef.current == null) {
            console.error('onUpdateNow when managedSwRef.current null');
            return;
        }
        managedSwRef.current.updateNow();
    }, [])

    return [
        setManagedSw,
        onVersionConflict,
        {
            swChecking,
            updatingAtStart,
            updateAvailable,
            updateSpinning,
            onUpdateNow,
        },
    ]
}

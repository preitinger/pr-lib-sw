'use client'

import { useCallback, useEffect, useId, useState } from "react";
import { Container, Navbar } from "react-bootstrap";
import { TVersion, versionToString } from "../../pr-lib-utils/both";
import { doRequest, I18nRequiredForDoRequest } from "../../pr-lib-utils/client";
import ReadonlyText from "../../pr-lib-utils/client/components/ReadonlyText";
import SpinningButton from "../../pr-lib-utils/client/components/SpinningButton";
import { ManagedSwListener } from "../ManagedSw";
import useSw from "../hooks/useSw";
import { GetVersionRes, TGetVersionReq, TGetVersionRes } from "../requests";
import { MANAGED_SW } from "@/app/_lib/client/swSingleton";


export default function TestUseSw({
    l,
    clientVersion
}: {
    l: I18nRequiredForDoRequest;
    clientVersion: TVersion;
}) {
    const idPrefix = useId();

    const [swChecking, updatingAtStart, updateAvailable, updateSpinning, setManagedSw, onVersionConflict, onUpdateNow] = useSw();
    const [state, setState] = useState('');

    function id(suffix: string) {
        return idPrefix + suffix;
    }

    useEffect(() => {
        if (MANAGED_SW != null) {
            const managedSw = MANAGED_SW;
            const managedSwListener: ManagedSwListener = (e) => {
                if (managedSw == null) return;

                switch (e.type) {
                    case 'stateChanged':
                        setState(managedSw.state);
                        break;
                }
            }
            setManagedSw(managedSw);
            managedSw.addListener(managedSwListener);
            return () => {
                managedSw.removeListener(managedSwListener);
            }
        }
    }, [setManagedSw])

    const getVersion = useCallback((signal?: AbortSignal) => {
        doRequest<TGetVersionReq, TGetVersionRes>(
            l,
            '/api/getVersion',
            {
            },
            GetVersionRes,
            clientVersion,
            () => { },
            signal
        ).then(json => {
            switch (json.type) {
                case 'success':
                    if (json.version.main !== clientVersion.main || json.version.sub !== clientVersion.sub) {
                        onVersionConflict(clientVersion, json.version);
                    }
                    break;
                case 'error':
                    console.log('error in getVersion', json.error);
                    break;
            }
        })

    }, [l, clientVersion, onVersionConflict])

    return <>
        <Navbar>
            <Navbar.Brand>TestUseSw {versionToString(clientVersion)}</Navbar.Brand>
            {
                updatingAtStart && <p>Installiere neue Version ...</p>
            }
            {updateAvailable != null && <SpinningButton disabled={updateSpinning} spinning={updateSpinning} onClick={() => onUpdateNow()}>{updateAvailable}</SpinningButton>}
        </Navbar >
        <Container>
            <ReadonlyText controlId={id('state')} label='state' value={state} />
            <ReadonlyText controlId={id('swChecking')} label='swChecking' value={swChecking ? 'true' : 'false'} />
            <SpinningButton className='me-3 mb-3' onClick={() => getVersion(undefined)}>getVersion()</SpinningButton>

        </Container>
    </>
}
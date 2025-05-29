'use client'

import { useCallback, useEffect, useId, useState } from "react";
import { Button, Container } from "react-bootstrap";
import ReadonlyText from "../../pr-lib-utils/client/components/ReadonlyText";
import ManagedSw, { ManagedSwListener } from "../ManagedSw";
import assert from "assert";
import { doRequest, I18nRequiredForDoRequest } from "../../pr-lib-utils/client";
import { GetVersionRes, TGetVersionReq, TGetVersionRes } from "../requests";
import { sleep } from "../../pr-lib-utils/both";
import { TVersion, versionToString } from "../../pr-lib-sw-utils/sw-utils";

const managedSw = typeof window === 'object' ? new ManagedSw('/sw.js', '/') : null;

export default function TestManagedSw({
    l, 
    clientVersion
}: {
    l: I18nRequiredForDoRequest;
    clientVersion: TVersion;
}) {
    const [serverVersion, setServerVersion] = useState<TVersion | null>(null);
    const [state, setState] = useState('');
    const idPrefix = useId();

    useEffect(() => {
        assert(managedSw != null);

        const listener: ManagedSwListener = (e) => {
            switch (e.type) {
                case 'stateChanged':
                    setState(managedSw.state);
                    break;
            }
        }
        managedSw.addListener(listener)
        setState(managedSw.state);

        return () => {
            managedSw.removeListener(listener);
        }
    }, [])

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
                    setServerVersion(json.version);
                    if (json.version.main !== clientVersion.main || json.version.sub !== clientVersion.sub) {
                        managedSw?.versionConflict(clientVersion, json.version);
                    }
                    break;
                case 'error':
                    console.log('error in getVersion', json.error);
                    break;
            }
        })

    }, [l, clientVersion])

    useEffect(() => {
        const abortController = new AbortController();
        getVersion(abortController.signal);
        return () => {
            abortController.abort();
        }
    }, [getVersion])

    function id(suffix: string) {
        return idPrefix + suffix;
    }

    function getVersionQuickUpdateNow() {
        doRequest<TGetVersionReq, TGetVersionRes>(
            l,
            '/api/getVersion',
            {
            },
            GetVersionRes,
            clientVersion,
            () => { },
        ).then(json => {
            switch (json.type) {
                case 'success':
                    setServerVersion(json.version);
                    if (json.version.main !== clientVersion.main || json.version.sub !== clientVersion.sub) {
                        managedSw?.versionConflict(clientVersion, json.version);
                        sleep(1).then(() => {
                            managedSw?.updateNow();
                        })
                    }
                    break;
                case 'error':
                    console.log('error in getVersion', json.error);
                    break;
            }
        })
    }

    return <Container className='mt-3'>
        <ReadonlyText className='mb-3' controlId={id('clientVersion')} label='client version' value={versionToString(clientVersion)} />
        <ReadonlyText className='mb-3' controlId={id('serverVersion')} label='server version' value={serverVersion == null ? 'null' : versionToString(serverVersion)} />
        <ReadonlyText className='mb-3' controlId={id('state')} label='state' value={state} />
        <Button className='me-3 mb-3' onClick={() => getVersion(undefined)}>getVersion()</Button>
        <Button className='me-3 mb-3' onClick={() => managedSw?.updateNow()}>updateNow()</Button>
        <Button className='me-3 mb-3' onClick={getVersionQuickUpdateNow}>getVersion() - on conflickt quick updateNow()</Button>
    </Container>
}
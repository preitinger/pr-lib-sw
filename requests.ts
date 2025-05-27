import * as rt from 'runtypes'
import { Version } from '../pr-lib-sw-utils/sw-utils'

// These are requests to application server routes, not to the service worker. Those are in `./serviceWorkerMessages.ts`.

export const GetVersionReq = rt.Object({
    // no data
})
export type TGetVersionReq = rt.Static<typeof GetVersionReq>

export const GetVersionRes = rt.Object({
    type: rt.Literal('success'),
    version: Version,
})
export type TGetVersionRes = rt.Static<typeof GetVersionRes>


// Diese Datei muss immer identisch sein mit serviceWorker-for-pr-push-newsletter3/src/messages.ts bzw. app/_lib/submodules-pr-lib-sw/serviceWorkerMessages.ts

import * as rt from "runtypes"

export const GetVersionReq = rt.Object({
    type: rt.Literal('getVersion'),
})
export type TGetVersionReq = rt.Static<typeof GetVersionReq>

export const GetVersionRes = rt.Object({
    type: rt.Literal('success'),
    version: rt.Number,
})
export type TGetVersionRes = rt.Static<typeof GetVersionRes>

export const SkipWaiting = rt.Object({
    type: rt.Literal('skipWaiting'),
})
export type TSkipWaiting = rt.Static<typeof SkipWaiting>

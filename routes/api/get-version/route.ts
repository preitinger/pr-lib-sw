

import { NextRequest, NextResponse } from "next/server";
import { GetVersionReq, TGetVersionRes } from '../../../requests';
import { TVersion } from "@/app/_lib/submodules/pr-lib-sw-utils/sw-utils";

function myRes(res: TGetVersionRes): NextResponse {
    console.log('/api/getVersion res', res);
    return NextResponse.json(res);
}

export const getVersion_POST = (version: TVersion) => async function (request: NextRequest) {
    const json = await request.json();
    if (!GetVersionReq.guard(json)) {
        return new Response('', {
            status: 400
        });
    }
    return myRes({
        type: 'success',
        version
    })
}

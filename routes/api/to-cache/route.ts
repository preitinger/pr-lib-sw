import { clientPromise } from "@/app/_lib/submodules/pr-lib-utils/server";
import { NextRequest, NextResponse } from "next/server";


type SwDoc = {
    _id: string;
    toCache: string[];
}


export async function toCache_POST(request: NextRequest) {
    const json = await request.json();

    let toCache: string[] = [];

    if (typeof json === 'string') {
        const webApp = json;
        const client = await clientPromise;
        const db = client.db('sw');
        const col = db.collection<SwDoc>('sw');
        const doc = await col.findOne({_id: webApp});
        if (doc != null) {
            toCache = doc.toCache;
        }
    }

    return NextResponse.json(toCache)
}

import {authorizeRequest, getPopularItems} from "@/firebase/firebaseAdmin";
import {NextResponse} from "next/server";

export const GET = async (req: Request) => {
    try {
        // Verify the ID token
        const response = await authorizeRequest(req);
        if (!response) {
            return NextResponse.json({message: 'Unauthorized'}, {status: 401});
        }
        const size = Number.parseInt(new URLSearchParams(req.url).get('size') || "10");
        const month = Number.parseInt(new URLSearchParams(req.url).get('month') || "0");
        const items = await getPopularItems(size,month);
        return NextResponse.json(items);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({message: 'Error getting popular products', error: error.message}, {status: 500});
    }
};
export const dynamic = "force-dynamic";
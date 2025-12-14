import {authorizeRequest, deleteBanner} from "@/firebase/firebaseAdmin";
import {NextResponse} from "next/server";

export const DELETE = async (req: Request) => {
    try {
        // Verify the ID token
        const response = await authorizeRequest(req);
        if (!response) {
            return NextResponse.json({message: 'Unauthorized'}, {status: 401});
        }
        const name = new URL(req.url).pathname.split('/')[5];
        const writeResult = await deleteBanner(name || "");
        return NextResponse.json(writeResult);
    } catch (error: any) {
        console.error(error);
        // Return a response with error message
        return NextResponse.json({message: 'Error creating slides', error: error.message}, {status: 500});
    }
}
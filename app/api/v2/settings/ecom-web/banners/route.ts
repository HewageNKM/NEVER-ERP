import {NextResponse} from "next/server";
import {addABanner, authorizeRequest, getAllBanners, uploadFile} from "@/firebase/firebaseAdmin";

export const GET = async (req: Request) => {
    try {
        // Verify the ID token
        const response = await authorizeRequest(req);
        if (!response) {
            return NextResponse.json({message: 'Unauthorized'}, {status: 401});
        }
        const banners = await getAllBanners();
        return NextResponse.json(banners);
    } catch (error: any) {
        console.error(error);
        // Return a response with error message
        return NextResponse.json({message: 'Error fetching slides', error: error.message}, {status: 500});
    }
};
export const POST = async (req: Request) => {
    try {
        // Verify the ID token
        const response = await authorizeRequest(req);
        if (!response) {
            return NextResponse.json({message: 'Unauthorized'}, {status: 401});
        }
        const formData = await req.formData()

        const res = await uploadFile(formData.get('banner') as File, <string>formData.get("path"));
        const writeResult = await addABanner(res);
        return NextResponse.json(writeResult);
    } catch (error: any) {
        console.error(error);
        // Return a response with error message
        return NextResponse.json({message: 'Error creating slides', error: error.message}, {status: 500});
    }
}
export const dynamic = 'force-dynamic';

import {
  authorizeRequest,
  getSMS,
  sendTextMessage,
} from "@/firebase/firebaseAdmin";
import { NextResponse } from "next/server";
import { SMS } from "@/model/SMS";

export const POST = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sms: SMS = await req.json();
    if (!sms) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    const data = await sendTextMessage(sms);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;

    const sms = await getSMS(pageNumber, size);
    return NextResponse.json(sms);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  authorizeRequest,
  fetchAllEmails,
  sendEmail,
} from "@/firebase/firebaseAdmin";
import { Email } from "@/model/Email";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the URL and parse the query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;

    console.log(`Page number: ${page}, Size: ${size}`);
    const emails = await fetchAllEmails(page, size);
    // Return a response with the orders
    return NextResponse.json(emails);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error fetching emails", error: error.message },
      { status: 500 }
    );
  }
};
export const POST = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: Email = await req.json();
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    await sendEmail(body);
    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error sending emal", error: error.message },
      { status: 500 }
    );
  }
};
export const dynamic = "force-dynamic";

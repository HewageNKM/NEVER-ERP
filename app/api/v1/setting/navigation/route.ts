import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getNavigationConfig,
  saveNavigationConfig,
} from "@/services/WebsiteService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const config = await getNavigationConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching navigation", error: error.message },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    await saveNavigationConfig(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error saving navigation", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

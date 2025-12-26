import { authorizeRequest } from "@/services/AuthService";
import { getERPSettings, updateERPSettings } from "@/services/SettingService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const res = await getERPSettings();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error fetching orders", error: error.message },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const res = await updateERPSettings(body);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error fetching orders", error: error.message },
      { status: 500 }
    );
  }
};

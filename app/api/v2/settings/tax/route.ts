import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getTaxSettings, updateTaxSettings } from "@/services/TaxService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = await getTaxSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("[Tax Settings API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching tax settings", error: error.message },
      { status: 500 }
    );
  }
};

export const PUT = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const settings = await updateTaxSettings(body);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("[Tax Settings API] Error:", error);
    return NextResponse.json(
      { message: "Error updating tax settings", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

import { authorizeRequest } from "@/services/AuthService";
import { getSalesByCategory } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const data = await getSalesByCategory(from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch sales by category" },
      { status: 500 }
    );
  }
}

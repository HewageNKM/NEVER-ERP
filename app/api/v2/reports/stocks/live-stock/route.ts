import { NextRequest, NextResponse } from "next/server";
import { fetchLiveStock } from "@/services/ReportService";
import { authorizeRequest } from "@/services/AuthService";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLiveStock(stockId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Live Stock API Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch live stock" },
      { status: 500 }
    );
  }
}

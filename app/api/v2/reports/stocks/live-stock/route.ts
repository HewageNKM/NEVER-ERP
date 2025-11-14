import { NextRequest, NextResponse } from "next/server";
import { fetchLiveStock } from "@/services/ReportService";
import { authorizeRequest } from "@/firebase/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = parseInt(url.searchParams.get("size") || "20", 10);

    const data = await fetchLiveStock(page, size);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Live Stock API Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch live stock" },
      { status: 500 }
    );
  }
}

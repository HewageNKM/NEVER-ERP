import { authorizeRequest } from "@/services/AuthService";
import { fetchLowStock } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "10", 10);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLowStock(threshold, stockId);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Low Stock API Error:", err);
    return NextResponse.json(
      { message: "Failed to fetch low stock" },
      { status: 500 }
    );
  }
}

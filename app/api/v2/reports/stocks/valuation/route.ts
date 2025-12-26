import { authorizeRequest } from "@/services/AuthService";
import { fetchStockValuationByStock } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchStockValuationByStock(stockId);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Stock Valuation API Error:", err);
    return NextResponse.json(
      { message: "Error fetching stock valuation" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAvailableStocks } from "@/services/POSProductService";

// GET - Fetch all available stocks
export async function GET() {
  try {
    const stocks = await getAvailableStocks();
    return NextResponse.json(stocks);
  } catch (error: any) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

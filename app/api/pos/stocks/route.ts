import { NextResponse } from "next/server";
import { getAvailableStocks } from "@/services/POSProductService";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch all available stocks
export async function GET() {
  try {
    await verifyPosAuth();
    const stocks = await getAvailableStocks();
    return NextResponse.json(stocks);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

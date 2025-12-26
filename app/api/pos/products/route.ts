import { NextRequest, NextResponse } from "next/server";
import {
  getProductsByStock,
  searchProductsByStock,
} from "@/services/POSProductService";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch products by stock ID, with optional search
export async function GET(request: NextRequest) {
  try {
    await verifyPosAuth();

    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get("stockId");
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");

    if (!stockId) {
      return NextResponse.json(
        { error: "stockId is required" },
        { status: 400 }
      );
    }

    let products;
    if (query && query.trim()) {
      // Search products by name/SKU
      products = await searchProductsByStock(stockId, query);
    } else {
      // Get all products at stock location
      products = await getProductsByStock(stockId, page, size);
    }

    return NextResponse.json(products);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

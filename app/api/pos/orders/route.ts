import { NextRequest, NextResponse } from "next/server";
import { createPOSOrder, getOrder, getOrders } from "@/firebase/firebaseAdmin";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch/Search POS orders
export async function GET(request: NextRequest) {
  try {
    await verifyPosAuth();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (orderId) {
      const order = await getOrder(orderId);
      return NextResponse.json({ dataList: order ? [order] : [] });
    }

    // Default fetch (can add pagination later if needed)
    const orders = await getOrders(1, 10);
    return NextResponse.json({ dataList: orders });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

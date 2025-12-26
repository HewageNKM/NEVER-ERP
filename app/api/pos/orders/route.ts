import { NextRequest, NextResponse } from "next/server";
import { createPOSOrder } from "@/services/POSService";
import { getOrder, getOrders } from "@/firebase/firebaseAdmin"; // Generic getOrder stays in admin for now or move? User said "all pos backend". But getOrder is generic. I will leave getOrder in admin if it's reused, or import from POSService if I had moved it. I didn't move getOrder/getOrders because they are generic admin functions. I only moved POS specific createPOSOrder.
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";

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

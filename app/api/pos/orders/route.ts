import { NextRequest, NextResponse } from "next/server";
import { createPOSOrder } from "@/firebase/firebaseAdmin";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// POST - Create a new POS order
export async function POST(request: NextRequest) {
  try {
    await verifyPosAuth();

    const orderData = await request.json();

    // Validations
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Order must have items" },
        { status: 400 }
      );
    }

    const createdOrder = await createPOSOrder(orderData);

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

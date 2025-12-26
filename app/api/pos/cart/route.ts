import { NextRequest, NextResponse } from "next/server";
import {
  getPosCart,
  addItemToPosCart,
  removeFromPosCart,
  clearPosCart,
} from "@/services/POSCartService";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch all cart items
export async function GET() {
  try {
    await verifyPosAuth();
    const items = await getPosCart();
    return NextResponse.json(items);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    await verifyPosAuth();
    const item = await request.json();
    await addItemToPosCart(item);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    await verifyPosAuth();
    const body = await request.json();

    // If clearAll flag is set, clear entire cart
    if (body.clearAll) {
      await clearPosCart();
      return NextResponse.json({ success: true, message: "Cart cleared" });
    }

    // Otherwise, remove specific item
    await removeFromPosCart(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

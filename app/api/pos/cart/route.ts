import { NextRequest, NextResponse } from "next/server";
import {
  getPosCart,
  addItemToPosCart,
  removeFromPosCart,
  clearPosCart,
} from "@/services/POSCartService";

// GET - Fetch all cart items
export async function GET() {
  try {
    const items = await getPosCart();
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching POS cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    await addItemToPosCart(item);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error adding to POS cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
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
    console.error("Error removing from POS cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}

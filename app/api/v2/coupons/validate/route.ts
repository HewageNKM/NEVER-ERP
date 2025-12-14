import { validateCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    // This endpoint might be public (for checkout) or protected.
    // Usually public but maybe with a session token.
    // For now, let's keep it open or check for a user limit later.

    const data = await req.json();
    const { code, userId, cartTotal, cartItems } = data;

    if (!code) {
      return NextResponse.json(
        { message: "Coupon code is required" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, userId, cartTotal, cartItems);

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

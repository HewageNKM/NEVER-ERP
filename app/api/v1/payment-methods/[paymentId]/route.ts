import {
  authorizeRequest,
  updatePaymentMethod,
} from "@/firebase/firebaseAdmin";
import { NextResponse } from "next/server";
import { PaymentMethod } from "@/model/PaymentMethod";

export const PUT = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: PaymentMethod = await req.json();
    await updatePaymentMethod(body);
    return NextResponse.json({
      message: "Payment method updated successfully",
    });
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

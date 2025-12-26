import { NextResponse } from "next/server";
import { getPaymentMethods } from "@/firebase/firebaseAdmin";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch payment methods for POS
export async function GET() {
  try {
    await verifyPosAuth();

    const methods = await getPaymentMethods();
    return NextResponse.json(methods);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

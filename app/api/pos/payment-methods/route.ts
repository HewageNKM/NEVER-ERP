import { NextResponse } from "next/server";
import { getPaymentMethods } from "@/firebase/firebaseAdmin";
import { verifyPosAuth, handleAuthError } from "@/services/POSAuthService";

// GET - Fetch payment methods for POS
export async function GET() {
  try {
    await verifyPosAuth();

    const methods = await getPaymentMethods();

    // Filter for POS availability if the 'available' field exists and includes 'POS'
    // If 'available' field is missing, assume it's available for all or handle as needed.
    // Based on user code in POSPaymentForm, we want methods where available includes "POS"
    const posMethods = methods.filter(
      (m: any) => Array.isArray(m.available) && m.available.includes("POS")
    );

    return NextResponse.json(posMethods);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

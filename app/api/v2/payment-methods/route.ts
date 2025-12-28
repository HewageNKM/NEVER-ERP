import { NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { PaymentMethod } from "@/model/PaymentMethod";
import { handleAuthError, verifyPosAuth } from "@/services/AuthService"; // Reusing auth service, though might need admin check?
// Assuming verifyPosAuth is checking for valid user, but ERP might need stricter role check.
// For now, using what's available or simple auth check.
import { auth } from "firebase-admin";
import { headers } from "next/headers";

// Helper to verify admin/authorized user for ERP
async function verifyAdmin() {
  // Simple check for now: just must be logged in.
  // In a real ERP, we'd check claims.
  const headersList = await headers();
  const token = headersList.get("authorization")?.split("Bearer ")[1];

  if (!token) throw new Error("Unauthorized");

  // Verify token
  try {
    await auth().verifyIdToken(token);
  } catch (e) {
    throw new Error("Unauthorized");
  }
}

// GET: List all payment methods
export async function GET() {
  try {
    await verifyAdmin();

    const snapshot = await adminFirestore.collection("payment_methods").get();
    const methods = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(methods);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST: Create a new payment method
export async function POST(req: Request) {
  try {
    await verifyAdmin();

    const body = await req.json();
    const { name, fee, status, available, description, paymentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newDocRef = adminFirestore.collection("payment_methods").doc();
    const newMethod: any = {
      id: newDocRef.id,
      name,
      fee: Number(fee) || 0,
      status: status === true, // Ensure boolean
      available: Array.isArray(available) ? available : ["Store"],
      description: description || "",
      paymentId: paymentId || `pm-${Math.floor(Math.random() * 1000)}`, // Auto-gen if missing? Or allow empty. User provided pm-001 format.
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newDocRef.set(newMethod);

    return NextResponse.json({ success: true, method: newMethod });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

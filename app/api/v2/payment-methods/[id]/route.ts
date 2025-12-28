import { NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { auth } from "firebase-admin";
import { headers } from "next/headers";

async function verifyAdmin() {
  const headersList = await headers();
  const token = headersList.get("authorization")?.split("Bearer ")[1];
  if (!token) throw new Error("Unauthorized");
  try {
    await auth().verifyIdToken(token);
  } catch (e) {
    throw new Error("Unauthorized");
  }
}

// PUT: Update payment method
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.fee !== undefined) updateData.fee = Number(body.fee);
    if (body.status !== undefined) updateData.status = body.status === true;
    if (body.available !== undefined) updateData.available = body.available;
    // Handle status toggle specifically if sent as isActive or similar, but sticking to 'status' field from model
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.paymentId !== undefined) updateData.paymentId = body.paymentId;

    await adminFirestore
      .collection("payment_methods")
      .doc(id)
      .update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Soft delete payment method
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();
    const { id } = await params;

    // Soft delete
    await adminFirestore.collection("payment_methods").doc(id).update({
      isDeleted: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "shipping_rules";

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updateData = {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Remove id from body if present to avoid overwriting doc ID field if we had one (we usually don't store ID in data for firestore, but safer to clean)
    delete updateData.id;

    await adminFirestore.collection(COLLECTION).doc(id).update(updateData);

    return NextResponse.json({ message: "Shipping rule updated successfully" });
  } catch (error) {
    console.error("Error updating shipping rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    await adminFirestore.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipping rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
};

import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { ShippingRule } from "@/model/ShippingRule";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "shipping_rules";

export const GET = async (req: NextRequest) => {
  try {
    const snapshot = await adminFirestore.collection(COLLECTION).get();
    const rules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching shipping rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, minWeight, maxWeight, rate, isActive } = body;

    if (
      !name ||
      minWeight === undefined ||
      maxWeight === undefined ||
      rate === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newRule: Partial<ShippingRule> = {
      name,
      minWeight: Number(minWeight),
      maxWeight: Number(maxWeight),
      rate: Number(rate),
      isActive: isActive ?? true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminFirestore.collection(COLLECTION).add(newRule);

    return NextResponse.json(
      { id: docRef.id, message: "Shipping rule created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shipping rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
};

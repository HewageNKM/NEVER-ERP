import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUser } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  getPettyCashById,
  updatePettyCash,
  deletePettyCash,
} from "@/services/PettyCashService";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const entry = await getPettyCashById(id);

    if (!entry) {
      return NextResponse.json(
        { message: "Petty Cash entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error("GET PettyCash Detail Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;

    const data: any = {};
    formData.forEach((value, key) => {
      if (key !== "attachment") {
        data[key] = value;
      }
    });

    if (data.amount) data.amount = parseFloat(data.amount);

    // Update user tracking
    if (user.userId) {
      data.updatedBy = user.userId;

      // If status is being changed to APPROVED or REJECTED, record reviewer
      if (data.status === "APPROVED" || data.status === "REJECTED") {
        data.reviewedBy = user.userId;
        data.reviewedAt = Timestamp.now();
      }
    }

    const updatedEntry = await updatePettyCash(id, data, file || undefined);
    return NextResponse.json(updatedEntry);
  } catch (error: any) {
    console.error("PUT PettyCash Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deletePettyCash(id);

    return NextResponse.json(
      { message: "Petty Cash entry deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE PettyCash Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

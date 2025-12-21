import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getAdjustmentById } from "@/services/InventoryAdjustmentService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adjustment = await getAdjustmentById(id);

    if (!adjustment) {
      return NextResponse.json(
        { message: "Adjustment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(adjustment);
  } catch (error: any) {
    console.error("[Adjustment API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching adjustment", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

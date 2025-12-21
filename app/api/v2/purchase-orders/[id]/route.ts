import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePOStatus,
} from "@/services/PurchaseOrderService";

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
    const po = await getPurchaseOrderById(id);

    if (!po) {
      return NextResponse.json(
        { message: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(po);
  } catch (error: any) {
    console.error("[Purchase Order API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching purchase order", error: error.message },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Handle status update separately
    if (body.status && Object.keys(body).length === 1) {
      const po = await updatePOStatus(id, body.status);
      return NextResponse.json(po);
    }

    const po = await updatePurchaseOrder(id, body);
    return NextResponse.json(po);
  } catch (error: any) {
    console.error("[Purchase Order API] Error:", error);
    return NextResponse.json(
      { message: "Error updating purchase order", error: error.message },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deletePurchaseOrder(id);

    return NextResponse.json({ message: "Purchase order deleted" });
  } catch (error: any) {
    console.error("[Purchase Order API] Error:", error);
    return NextResponse.json(
      { message: error.message || "Error deleting purchase order" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

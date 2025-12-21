import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  getPendingPurchaseOrders,
} from "@/services/PurchaseOrderService";
import { PurchaseOrderStatus } from "@/model/PurchaseOrder";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as PurchaseOrderStatus | null;
    const supplierId = url.searchParams.get("supplierId");
    const pending = url.searchParams.get("pending");

    if (pending === "true") {
      const data = await getPendingPurchaseOrders();
      return NextResponse.json(data);
    }

    const data = await getPurchaseOrders(
      status || undefined,
      supplierId || undefined
    );
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Purchase Orders API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching purchase orders", error: error.message },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const po = await createPurchaseOrder(body);
    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    console.error("[Purchase Orders API] Error:", error);
    return NextResponse.json(
      { message: "Error creating purchase order", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

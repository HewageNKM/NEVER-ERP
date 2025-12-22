import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getSupplierInvoiceById,
  updateSupplierInvoice,
  deleteSupplierInvoice,
} from "@/services/SupplierInvoiceService";

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
    const invoice = await getSupplierInvoiceById(id);

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("[Invoice API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching invoice", error: error.message },
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
    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;

    const data: any = {};
    formData.forEach((value, key) => {
      if (key !== "attachment") data[key] = value;
    });

    const invoice = await updateSupplierInvoice(id, data, file || undefined);
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("[Invoice API] Error:", error);
    return NextResponse.json(
      { message: "Error updating invoice", error: error.message },
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
    await deleteSupplierInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Invoice API] Error:", error);
    return NextResponse.json(
      { message: "Error deleting invoice", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

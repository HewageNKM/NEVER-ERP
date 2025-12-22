import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getSupplierInvoices,
  createSupplierInvoice,
  getInvoiceAgingSummary,
} from "@/services/SupplierInvoiceService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const summary = url.searchParams.get("summary") === "true";
    if (summary) {
      const data = await getInvoiceAgingSummary();
      return NextResponse.json(data);
    }

    const filters = {
      supplierId: url.searchParams.get("supplierId") || undefined,
      status: url.searchParams.get("status") || undefined,
    };

    const data = await getSupplierInvoices(filters);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Invoices API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching invoices", error: error.message },
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

    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;

    const data: any = {};
    formData.forEach((value, key) => {
      if (key !== "attachment") data[key] = value;
    });

    if (response.userId) data.createdBy = response.userId;

    const invoice = await createSupplierInvoice(data, file || undefined);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("[Invoices API] Error:", error);
    return NextResponse.json(
      { message: "Error creating invoice", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

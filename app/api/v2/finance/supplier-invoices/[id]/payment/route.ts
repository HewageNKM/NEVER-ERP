import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { recordInvoicePayment } from "@/services/SupplierInvoiceService";

export const POST = async (
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
    const { amount, bankAccountId, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const updatedInvoice = await recordInvoicePayment(
      id,
      amount,
      bankAccountId,
      notes
    );

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("[Invoice Payment API] Error:", error);
    return NextResponse.json(
      { message: "Error recording payment", error: error.message },
      { status: 500 }
    );
  }
};

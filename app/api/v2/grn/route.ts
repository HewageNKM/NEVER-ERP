import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getGRNs, createGRN } from "@/services/GRNService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const purchaseOrderId = url.searchParams.get("purchaseOrderId");

    const data = await getGRNs(purchaseOrderId || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GRN API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching GRNs", error: error.message },
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
    const grn = await createGRN(body);
    return NextResponse.json(grn, { status: 201 });
  } catch (error: any) {
    console.error("[GRN API] Error:", error);
    return NextResponse.json(
      { message: "Error creating GRN", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

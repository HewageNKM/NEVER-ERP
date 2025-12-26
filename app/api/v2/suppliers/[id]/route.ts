import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "@/services/SupplierService";

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
    const supplier = await getSupplierById(id);

    if (!supplier) {
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("[Supplier API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching supplier", error: error.message },
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
    const supplier = await updateSupplier(id, body);

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("[Supplier API] Error:", error);
    return NextResponse.json(
      { message: "Error updating supplier", error: error.message },
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
    await deleteSupplier(id);

    return NextResponse.json({ message: "Supplier deleted" });
  } catch (error: any) {
    console.error("[Supplier API] Error:", error);
    return NextResponse.json(
      { message: "Error deleting supplier", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

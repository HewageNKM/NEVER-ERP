import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getSuppliers,
  createSupplier,
  getSuppliersDropdown,
} from "@/services/SupplierService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const dropdown = url.searchParams.get("dropdown");
    const status = url.searchParams.get("status") as
      | "active"
      | "inactive"
      | null;

    if (dropdown === "true") {
      const data = await getSuppliersDropdown();
      return NextResponse.json(data);
    }

    const data = await getSuppliers(status || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Suppliers API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching suppliers", error: error.message },
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
    const supplier = await createSupplier(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("[Suppliers API] Error:", error);
    return NextResponse.json(
      { message: "Error creating supplier", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

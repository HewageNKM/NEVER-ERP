import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getGRNById } from "@/services/GRNService";

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
    const grn = await getGRNById(id);

    if (!grn) {
      return NextResponse.json({ message: "GRN not found" }, { status: 404 });
    }

    return NextResponse.json(grn);
  } catch (error: any) {
    console.error("[GRN API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching GRN", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

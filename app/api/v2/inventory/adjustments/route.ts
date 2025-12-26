import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getAdjustments,
  createAdjustment,
} from "@/services/InventoryAdjustmentService";
import { AdjustmentType } from "@/model/InventoryAdjustment";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as AdjustmentType | null;

    const data = await getAdjustments(type || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching adjustments", error: error.message },
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
    const adjustment = await createAdjustment(body);
    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return NextResponse.json(
      { message: "Error creating adjustment", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

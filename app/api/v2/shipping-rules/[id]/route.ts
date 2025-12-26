import { NextRequest, NextResponse } from "next/server";
import {
  updateShippingRule,
  deleteShippingRule,
} from "@/services/ShippingRuleService";

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    await updateShippingRule(id, body);

    return NextResponse.json({ message: "Shipping rule updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    await deleteShippingRule(id);
    return NextResponse.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
};

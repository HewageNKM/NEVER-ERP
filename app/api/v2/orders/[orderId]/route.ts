import { authorizeRequest } from "@/services/AuthService";
import { getOrder, updateOrder } from "@/services/OrderService";
import { NextResponse } from "next/server";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json();
    if (!body.paymentStatus || !body.status) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    const id = orderId;
    await updateOrder(body, id);

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
export const GET = async (
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) => {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/orders/[orderId] error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

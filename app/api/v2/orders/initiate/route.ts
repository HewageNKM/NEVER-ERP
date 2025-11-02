import { Order } from "@/model";
import { authorizeOrderRequest } from "@/services/AuthService";
import { addOrder } from "@/services/OrderService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const authorization = await authorizeOrderRequest(req);
    if (!authorization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orderData: Partial<Order> = await req.json();
    const res = addOrder(orderData);
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error });
  }
};

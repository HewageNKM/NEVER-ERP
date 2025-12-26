import { authorizeRequest } from "@/services/AuthService";
import { getInventoryQuantity } from "@/services/InventoryService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    const variantId = searchParams.get("variantId") || "";
    const size = searchParams.get("size") || "";
    const stockId = searchParams.get("stockId") || "";

    const res = await getInventoryQuantity(productId, variantId, size, stockId);
    return NextResponse.json(res);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

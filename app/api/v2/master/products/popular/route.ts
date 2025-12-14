import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getPopularProducts } from "@/services/ProductService"; // Import your service

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const size = Number.parseInt(req.nextUrl.searchParams.get("size") || "0");
    const startDate = req.nextUrl.searchParams.get("startDate") || "";
    const endDate = req.nextUrl.searchParams.get("endDate") || "";

    const product = await getPopularProducts(startDate, endDate, size);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`GET /api/v2/master/products/ Error:`, error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

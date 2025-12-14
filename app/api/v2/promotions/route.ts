import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getPromotions, createPromotion } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const filterStatus = searchParams.get("status") || undefined;

    const result = await getPromotions(page, size, filterStatus);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/v2/promotions Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    // Allow ADMIN or EDITOR roles? Assuming any authorized user for now, or check detailed role
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Basic validation
    if (!data.name || !data.type) {
      return NextResponse.json(
        { message: "Name and Type are required" },
        { status: 400 }
      );
    }

    const promotion = await createPromotion(data);
    return NextResponse.json(promotion, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v2/promotions Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

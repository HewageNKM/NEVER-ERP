import { authorizeRequest } from "@/services/AuthService";
import { updateCoupon, deleteCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: Props) => {
  return errorResponse("Not implemented fetching by ID yet, use list", 501);
};

export const PUT = async (req: NextRequest, { params }: Props) => {
  try {
    await authorizeRequest(req);

    const { id } = await params;
    const data = await req.json();
    await updateCoupon(id, data);

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const DELETE = async (req: NextRequest, { params }: Props) => {
  try {
    await authorizeRequest(req);

    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return errorResponse(error);
  }
};

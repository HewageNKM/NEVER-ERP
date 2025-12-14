import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: {
    id: string;
  };
}

export const GET = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const promotion = await getPromotionById(params.id);
    if (!promotion) {
      return NextResponse.json(
        { message: "Promotion not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(promotion);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const PUT = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    await updatePromotion(params.id, data);

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await deletePromotion(params.id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

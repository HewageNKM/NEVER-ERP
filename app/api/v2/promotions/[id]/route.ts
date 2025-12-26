import { authorizeRequest } from "@/services/AuthService";
import {
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const promotion = await getPromotionById(id);
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

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("banner") as File | null;

    // Parse JSON-encoded fields or reconstruct object
    const data: any = {};
    for (const [key, value] of formData.entries()) {
      if (key === "banner") continue;
      if (
        [
          "conditions",
          "actions",
          "applicableProducts",
          "applicableProductVariants",
          "applicableCategories",
          "applicableBrands",
          "excludedProducts",
        ].includes(key)
      ) {
        try {
          data[key] = JSON.parse(value as string);
        } catch {
          data[key] = value;
        }
      } else if (key === "stackable") {
        data[key] = value === "true";
      } else {
        data[key] = value;
      }
    }

    await updatePromotion(id, data, file);

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

    const { id } = await params;
    await deletePromotion(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

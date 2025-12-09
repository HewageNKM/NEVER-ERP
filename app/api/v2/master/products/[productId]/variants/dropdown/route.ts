import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getProductVariantsForDropdown } from "@/services/VariantService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { productId } = await params;
    const id = productId;
    const res = await getProductVariantsForDropdown(id);
    return NextResponse.json(res);
  } catch (error) {
    console.error("GET Product Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

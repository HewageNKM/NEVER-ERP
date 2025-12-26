import { authorizeRequest } from "@/services/AuthService";
import { getProductDropdown } from "@/services/ProductService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const res = await getProductDropdown();
    return NextResponse.json(res);
  } catch (err) {
    console.error("Get Categories Error:", err);
    return NextResponse.json([], { status: 500 });
  }
};

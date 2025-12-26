import { authorizeRequest } from "@/services/AuthService";
import { getCategoriesForDropdown } from "@/services/CategoryService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const res = await getCategoriesForDropdown();
    return NextResponse.json(res);
  } catch (err) {
    console.error("Get Categories Error:", err);
    return NextResponse.json([], { status: 500 });
  }
};

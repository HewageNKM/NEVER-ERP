import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { createCategory, getCategories } from "@/services/CategoryService";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") as
      | "active"
      | "inactive"
      | null;

    const result = await getCategories({ page, size, search, status });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const category = await req.json();
    if (!category.name)
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );

    const res = await createCategory(category);
    return NextResponse.json(res);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
};

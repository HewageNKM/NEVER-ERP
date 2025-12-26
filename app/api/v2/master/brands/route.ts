import { NextResponse } from "next/server";
import { createBrand, getBrands } from "@/services/BrandService";
import { authorizeRequest } from "@/services/AuthService";

export const GET = async (req: Request) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const size = Number(searchParams.get("size") || 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as "active" | "inactive" | null;

    const data = await getBrands({ page, size, search, status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Get Brands Error:", err);
    return NextResponse.json({ dataList: [], rowCount: 0 }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const active = formData.get("status") === "true";
    const logo = formData.get("logo") as File | null;

    const result = await createBrand(
      { name, description, status: active },
      logo || undefined
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Create Brand Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create brand" },
      { status: 500 }
    );
  }
};

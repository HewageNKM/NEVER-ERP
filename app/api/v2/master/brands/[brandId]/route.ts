import { NextResponse } from "next/server";
import {
  getBrandById,
  updateBrand,
  deleteBrand,
} from "@/services/BrandService";
import { authorizeRequest } from "@/services/AuthService";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(_req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const result = await getBrandById(brandId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Get Brand Error:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching brand" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") === "true";
    const logo = formData.get("logo") as File | null;

    const result = await updateBrand(
      brandId,
      { name, description, status },
      logo || undefined
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Update Brand Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update brand" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ brandId: string }> }
) => {
  try {
    const { brandId } = await params;
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const result = await deleteBrand(brandId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Delete Brand Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete brand" },
      { status: 500 }
    );
  }
};

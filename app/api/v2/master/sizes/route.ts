import { NextResponse } from "next/server";
import { getSizes, createSize } from "@/services/SizeService";
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

    const data = await getSizes({ page, size, search, status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Get Sizes Error:", err);
    return NextResponse.json({ dataList: [], rowCount: 0 }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const sizeData = await req.json();

    if (!sizeData.name || !sizeData.status)
      return NextResponse.json(
        { message: "Name and status are required" },
        { status: 400 }
      );

    const result = await createSize(sizeData);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Create Size Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create size" },
      { status: 500 }
    );
  }
};

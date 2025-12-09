import { NextResponse } from "next/server";
import { updateSize, deleteSize, getSizes } from "@/services/SizeService";
import { authorizeRequest } from "@/firebase/firebaseAdmin";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    const user = await authorizeRequest(_req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const data = await getSizes({ page: 1, size: 1 }); // optionally fetch single
    const size = data.dataList.find((s) => s.id === sizeId);
    if (!size)
      return NextResponse.json(
        { success: false, message: "Size not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, data: size });
  } catch (err) {
    console.error("Get Size Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch size" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const sizeData = await req.json();
    const { name, status } = sizeData;

    if (!name || !status)
      return NextResponse.json(
        { message: "Name and status are required" },
        { status: 400 }
      );

    const result = await updateSize(sizeId, sizeData);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Update Size Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update size" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ sizeId: string }> }
) => {
  try {
    const { sizeId } = await params;
    const user = await authorizeRequest(_req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const result = await deleteSize(sizeId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Delete Size Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete size" },
      { status: 500 }
    );
  }
};

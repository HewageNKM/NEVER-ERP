import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { updateStock, deleteStock } from "@/services/StockService"; // Use StockService
import { NextRequest, NextResponse } from "next/server";

// PUT Handler: Update a specific stock location
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) => {
  try {
    const { stockId } = await params;
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!stockId) {
      return NextResponse.json(
        { message: "Stock ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const updateData: any = {};

    // Validate and build update object
    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim() === "") {
        return NextResponse.json(
          { message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = data.name.trim();
    }
    if (data.address !== undefined) {
      // Allow clearing address
      updateData.address =
        typeof data.address === "string" ? data.address.trim() : "";
    }
    if (data.status !== undefined) {
      if (typeof data.status !== "boolean") {
        return NextResponse.json(
          { message: "Status must be true or false" },
          { status: 400 }
        );
      }
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const success = await updateStock(stockId, updateData);

    if (!success) {
      // updateStock throws error on failure, this might not be reached unless error is caught differently
      return NextResponse.json(
        { message: "Failed to update stock location" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Stock location updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `PUT /api/v2/master/stocks/${(await params).stockId} Error:`,
      error
    );
    if (error.message?.includes("not found")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

// DELETE Handler: Soft-delete a specific stock location
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) => {
  try {
    const { stockId } = await params;
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!stockId) {
      return NextResponse.json(
        { message: "Stock ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteStock(stockId);

    if (!success) {
      // deleteStock throws error on failure
      return NextResponse.json(
        { message: "Failed to delete stock location" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Stock location deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `DELETE /api/v2/master/stocks/${(await params).stockId} Error:`,
      error
    );
    if (error.message?.includes("not found")) {
      // Handle potential not found error from service
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

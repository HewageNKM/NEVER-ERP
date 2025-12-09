import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { updateInventoryQuantity } from "@/services/InventoryService"; // Use specific update function
import { NextRequest, NextResponse } from "next/server";

// PUT Handler: Update quantity for a specific inventory item
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> }
) => {
  try {
    const { inventoryId } = await params;
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!inventoryId) {
      return NextResponse.json(
        { message: "Inventory ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Validate quantity
    if (
      data.quantity === undefined ||
      typeof data.quantity !== "number" ||
      data.quantity < 0 ||
      !Number.isInteger(data.quantity)
    ) {
      return NextResponse.json(
        { message: "Quantity is required and must be a non-negative integer" },
        { status: 400 }
      );
    }

    const updatedItem = await updateInventoryQuantity(
      inventoryId,
      data.quantity
    );

    return NextResponse.json(updatedItem, { status: 200 }); // Return updated item
  } catch (error: any) {
    // We try to access inventoryId from await params if possible, or fallback safely
    // Since we can't easily access it if the await failed (unlikely for params), we won't try too hard in catch
    console.error(`PUT /api/v2/inventory Error:`, error);
    if (error.message?.includes("not found")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

// Optional: DELETE Handler if you want hard deletion
// export const DELETE = async (req: NextRequest, { params }: { params: { inventoryId: string } }) => { ... }

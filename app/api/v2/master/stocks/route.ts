import { authorizeRequest } from "@/services/AuthService";
import { getStocks, addStock } from "@/services/StockService"; // Use StockService
import { NextRequest, NextResponse } from "next/server";

// GET Handler: Fetch list of stock locations
export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "10");
    const search = searchParams.get("search") || undefined;
    const statusParam = searchParams.get("status");

    let status: boolean | undefined;
    if (statusParam === "active" || statusParam === "true") {
      // Allow 'true' as well
      status = true;
    } else if (statusParam === "inactive" || statusParam === "false") {
      // Allow 'false'
      status = false;
    }

    const result = await getStocks(page, size, search, status);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v2/master/stocks Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// POST Handler: Create a new stock location
export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Basic Validation
    if (
      !data.name ||
      typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Stock location name is required" },
        { status: 400 }
      );
    }
    if (typeof data.status !== "boolean") {
      return NextResponse.json(
        { message: "Status (true/false) is required" },
        { status: 400 }
      );
    }

    // Ensure only expected fields are passed
    const stockData = {
      name: data.name.trim(),
      address: data.address?.trim() || "", // Handle optional address
      status: data.status,
    };

    const newStock = await addStock(stockData);
    return NextResponse.json(newStock, { status: 201 }); // Return the created object
  } catch (error) {
    console.error("POST /api/v2/master/stocks Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

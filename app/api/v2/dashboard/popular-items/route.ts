import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getPopularItems } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const url = new URL(req.url);
    const sizeParam = url.searchParams.get("size");
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");

    const size = sizeParam ? parseInt(sizeParam, 10) : 10;
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const items = await getPopularItems(size, month, year);

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("[Dashboard Popular Items API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching popular items", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

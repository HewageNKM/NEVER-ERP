import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getYearlySalesPerformance } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get optional year from query params
    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const salesData = await getYearlySalesPerformance(year);

    return NextResponse.json(salesData);
  } catch (error: any) {
    console.error("[Dashboard Sales API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching sales performance", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

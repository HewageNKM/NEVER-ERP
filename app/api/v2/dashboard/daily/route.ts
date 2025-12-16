import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getDailySnapshot } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const overview = await getDailySnapshot();

    // Map to match existing frontend expectations
    return NextResponse.json({
      totalOrders: overview.totalOrders,
      totalEarnings: overview.totalGrossSales,
      totalBuyingCost: overview.totalBuyingCost,
      totalProfit: overview.totalProfit,
      totalDiscount: overview.totalDiscount,
    });
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching daily snapshot", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

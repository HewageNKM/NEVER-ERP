import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getLowStockAlerts } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "5");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const data = await getLowStockAlerts(threshold, limit);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching low stock alerts", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

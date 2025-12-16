import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getRecentOrders } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get optional limit from query params
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 6;

    const orders = await getRecentOrders(limit);

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("[Dashboard Recent Orders API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching recent orders", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

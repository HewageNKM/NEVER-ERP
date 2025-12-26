import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getMonthlyComparison } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getMonthlyComparison();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching monthly comparison", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

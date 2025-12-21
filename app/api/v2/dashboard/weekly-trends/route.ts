import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getWeeklyTrends } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getWeeklyTrends();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching weekly trends", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getDailySnapshot } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const overview = await getDailySnapshot();
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching daily snapshot", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

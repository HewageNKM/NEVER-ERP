import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getExpenseSummary } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getExpenseSummary();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching expense summary", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

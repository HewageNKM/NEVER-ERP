import { authorizeRequest } from "@/services/AuthService";
import {
  getDailyRevenueReport,
  getMonthlyRevenueReport,
} from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const res = await getMonthlyRevenueReport(from, to);

    return NextResponse.json(res);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch sales by category" },
      { status: 500 }
    );
  }
}

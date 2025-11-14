import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getSalesVsDiscount } from "@/services/ReportService";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const groupBy = (url.searchParams.get("groupBy") as "day" | "month") || "day";

    const data = await getSalesVsDiscount(from, to, groupBy);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch Sales vs Discount" }, { status: 500 });
  }
}

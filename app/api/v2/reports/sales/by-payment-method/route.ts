import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getSalesByPaymentMethod } from "@/services/ReportService";

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRequest(req);
    if (!auth)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const data = await getSalesByPaymentMethod(from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error generating report" },
      { status: 500 }
    );
  }
}

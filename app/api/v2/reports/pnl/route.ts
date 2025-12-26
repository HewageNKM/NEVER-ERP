import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getProfitLossStatement } from "@/services/ReportService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { message: "Missing required parameters: from, to" },
        { status: 400 }
      );
    }

    const data = await getProfitLossStatement(from, to);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[P&L Report API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching P&L statement", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

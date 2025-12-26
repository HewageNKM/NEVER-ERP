import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getExpenseReport } from "@/services/ReportService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const category = url.searchParams.get("category") || undefined;

    if (!from || !to) {
      return NextResponse.json(
        { message: "Missing required parameters: from, to" },
        { status: 400 }
      );
    }

    const data = await getExpenseReport(from, to, category);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Expense Report API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching expense report", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getTopSellingProducts } from "@/services/ReportService";
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
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "20");

    const data = await getTopSellingProducts(from, to, page, size);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch top selling products" }, { status: 500 });
  }
}

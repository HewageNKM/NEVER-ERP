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
    const threshold =  Number.parseInt(url.searchParams.get("threshold") || "10");

    const data = await getTopSellingProducts(from, to, threshold);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch top selling products" },
      { status: 500 }
    );
  }
}

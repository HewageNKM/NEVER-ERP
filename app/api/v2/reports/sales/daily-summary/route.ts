import { authorizeRequest } from "@/firebase/firebaseAdmin";
import { getSaleReport } from "@/services/ReportService";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const authRes = await authorizeRequest(req);
    if (!authRes)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const res = await getSaleReport(from, to);
    return new Response(JSON.stringify(res), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
};

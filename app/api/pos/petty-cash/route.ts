import { NextRequest, NextResponse } from "next/server";
import { getPettyCash, addPettyCashTransaction } from "@/services/POSService";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";

// GET - Fetch transactions
export async function GET(request: NextRequest) {
  try {
    await verifyPosAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const transactions = await getPettyCash(limit);
    return NextResponse.json({ dataList: transactions });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// POST - Add transaction
export async function POST(request: NextRequest) {
  try {
    await verifyPosAuth();
    const data = await request.json();

    if (!data.amount || !data.description || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transaction = await addPettyCashTransaction(data);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

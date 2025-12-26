import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  updateBankAccountBalance,
} from "@/services/BankAccountService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const account = await getBankAccountById(id);

    if (!account) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error("[BankAccount API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching account", error: error.message },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if this is a balance update
    if (body.balanceUpdate) {
      const account = await updateBankAccountBalance(
        id,
        body.amount,
        body.type
      );
      return NextResponse.json(account);
    }

    const account = await updateBankAccount(id, body);
    return NextResponse.json(account);
  } catch (error: any) {
    console.error("[BankAccount API] Error:", error);
    return NextResponse.json(
      { message: "Error updating account", error: error.message },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteBankAccount(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[BankAccount API] Error:", error);
    return NextResponse.json(
      { message: "Error deleting account", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

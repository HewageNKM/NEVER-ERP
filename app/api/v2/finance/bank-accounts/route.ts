import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getBankAccounts,
  createBankAccount,
  getBankAccountsDropdown,
  getTotalBalance,
} from "@/services/BankAccountService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const dropdown = url.searchParams.get("dropdown") === "true";
    const summary = url.searchParams.get("summary") === "true";

    if (dropdown) {
      const data = await getBankAccountsDropdown();
      return NextResponse.json(data);
    }

    if (summary) {
      const total = await getTotalBalance();
      return NextResponse.json({ totalBalance: total });
    }

    const data = await getBankAccounts();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[BankAccounts API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching accounts", error: error.message },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const account = await createBankAccount(body);
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error("[BankAccounts API] Error:", error);
    return NextResponse.json(
      { message: "Error creating account", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

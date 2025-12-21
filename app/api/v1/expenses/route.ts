import { NextResponse } from "next/server";
import {
  addNewExpense,
  authorizeRequest,
  getAllExpenses,
  getAllExpensesByDate,
} from "@/firebase/firebaseAdmin";
import { Expense } from "@/model/Expense";

export const POST = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const timestamp = await addNewExpense(body as Expense);
    return NextResponse.json(
      { message: "expense saved successfully", timestamp },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error adding expense", error: error.message },
      { status: 500 }
    );
  }
};

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const page = Number.parseInt(<string>url.searchParams.get("page"));
    const size = Number.parseInt(<string>url.searchParams.get("size"));
    const date = <string>url.searchParams.get("date");
    if (page && size) {
      const allExpenses = await getAllExpenses(page, size);
      return NextResponse.json(allExpenses);
    } else if (date) {
      const allExpenses = await getAllExpensesByDate(date);
      return NextResponse.json(allExpenses);
    }
    const allExpenses = await getAllExpenses(page, size);
    return NextResponse.json(allExpenses);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error getting expenses", error: error.message },
      { status: 500 }
    );
  }
};
export const dynamic = "force-dynamic";

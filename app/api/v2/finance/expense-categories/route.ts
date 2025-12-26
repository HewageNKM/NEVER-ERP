import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenseCategoriesDropdown,
} from "@/services/ExpenseCategoryService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as "expense" | "income" | null;
    const dropdown = url.searchParams.get("dropdown") === "true";

    if (dropdown) {
      const data = await getExpenseCategoriesDropdown(type || undefined);
      return NextResponse.json(data);
    }

    const data = await getExpenseCategories(type || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[ExpenseCategories API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching categories", error: error.message },
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
    const category = await createExpenseCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("[ExpenseCategories API] Error:", error);
    return NextResponse.json(
      { message: "Error creating category", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

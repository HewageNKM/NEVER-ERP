import { NextResponse } from "next/server";
import { authorizeRequest } from "@/firebase/firebaseAdmin";
import {
  getExpenseCategoryById,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/services/ExpenseCategoryService";

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
    const category = await getExpenseCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("[ExpenseCategory API] Error:", error);
    return NextResponse.json(
      { message: "Error fetching category", error: error.message },
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
    const category = await updateExpenseCategory(id, body);
    return NextResponse.json(category);
  } catch (error: any) {
    console.error("[ExpenseCategory API] Error:", error);
    return NextResponse.json(
      { message: "Error updating category", error: error.message },
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
    await deleteExpenseCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ExpenseCategory API] Error:", error);
    return NextResponse.json(
      { message: "Error deleting category", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";

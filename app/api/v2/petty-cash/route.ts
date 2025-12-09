import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUser } from "@/firebase/firebaseAdmin";
import { addPettyCash, getPettyCashList } from "@/services/PettyCashService";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;

    const result = await getPettyCashList(page, size, {
      status,
      type,
      category,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET PettyCash List Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("attachment") as File | null;

    const data: any = {};
    formData.forEach((value, key) => {
      if (key !== "attachment") {
        data[key] = value;
      }
    });

    if (data.amount) data.amount = parseFloat(data.amount);

    // Set createdBy from authenticated user
    if (user.userId) {
      data.createdBy = user.userId;
      data.updatedBy = user.userId;
    } else if (user.email) {
      // Fallback if userId is missing but email exists
      data.createdBy = user.email;
      data.updatedBy = user.email;
    }

    const newEntry = await addPettyCash(data, file || undefined);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error: any) {
    console.error("POST PettyCash Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

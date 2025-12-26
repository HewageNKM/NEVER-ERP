import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest, loginUser } from "@/services/AuthService";

export const POST = async (req: NextRequest) => {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: "Missing User ID" }, { status: 400 });
    }

    const user = await loginUser(uid);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

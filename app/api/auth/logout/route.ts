import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    // Backend-side logout logic if any (e.g. invalidating session cookies if we used them)
    // Since we use Firebase Auth on client, we mainly just return 200 to acknowledge.
    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error: any) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

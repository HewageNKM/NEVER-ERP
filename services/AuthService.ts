import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const authorizeOrderRequest = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token != "undefined" && token) {
      await adminAuth.verifyIdToken(token);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const verifyPosAuth = async () => {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid token");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const user = await adminFirestore
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!user.exists) {
      throw new Error("Unauthorized: User not found");
    }

    if (!user.data()?.role) {
      throw new Error("Unauthorized: Role not found");
    }

    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Unauthorized: Invalid token or user");
  }
};

export const handleAuthError = (error: any) => {
  const status = error.message.startsWith("Unauthorized") ? 401 : 500;
  return NextResponse.json(
    { error: error.message || "Internal Server Error" },
    { status }
  );
};

import { NextResponse } from "next/server";
import { authorizeRequest, updateUser } from "@/services/AuthService";
import { User } from "@/model/User";
import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body: Partial<User> = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await updateUser(userId, body);

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error updating user ${error.message}`);
    return NextResponse.json(
      { message: "Error updating user", error: error.message },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Delete from Auth
    try {
      await adminAuth.deleteUser(userId);
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") {
        // If user not found in auth, we proceed to delete from firestore
        throw e;
      }
    }

    // Delete from Firestore
    await adminFirestore.collection("users").doc(userId).delete();

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting user ${error.message}`);
    return NextResponse.json(
      { message: "Error deleting user", error: error.message },
      { status: 500 }
    );
  }
};

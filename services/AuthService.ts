import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/model/User";

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

export const authorizeRequest = async (req: any) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token && token !== "undefined") {
      const decodedIdToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminFirestore
        .collection("users")
        .doc(decodedIdToken.uid)
        .get();

      if (!userDoc.exists) {
        console.warn("User not found!");
        return false;
      }

      const userData = userDoc.data();
      if (userData?.status === "Inactive") {
        console.warn("User is inactive!");
        return false;
      }

      if (userData?.role === "ADMIN" || userData?.role === "OWNER") {
        return true;
      } else {
        console.warn("User is not Admin!");
        return false;
      }
    } else {
      console.warn("Authorization Failed! No token.");
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const authorizeAndGetUser = async (req: any): Promise<User | null> => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token && token !== "undefined") {
      const decodedIdToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminFirestore
        .collection("users")
        .doc(decodedIdToken.uid)
        .get();

      if (!userDoc.exists) {
        console.warn("User not found!");
        return null;
      }

      const userData = userDoc.data() as User;
      if (userData.status === "Inactive") {
        console.warn("User is inactive!");
        return null;
      }

      if (userData.role === "ADMIN" || userData.role === "OWNER") {
        return {
          ...userData,
          createdAt:
            (userData.createdAt as any)?.toDate?.()?.toLocaleString() ||
            userData.createdAt,
          updatedAt:
            (userData.updatedAt as any)?.toDate?.()?.toLocaleString() ||
            userData.updatedAt,
        } as User;
      } else {
        console.warn("User is not Admin!");
        return null;
      }
    } else {
      console.warn("Authorization Failed! No token.");
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const loginUser = async (userId: string) => {
  try {
    console.log(`Logging in user with ID: ${userId}`);
    // Check if user exists in Auth
    await adminAuth.getUser(userId);

    const userDoc = await adminFirestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.warn(`User with ID ${userId} not found`);
      throw new Error(`User with ID ${userId} not found`);
    }

    const userData = userDoc.data() as User;

    if (userData.status !== "Active") {
      throw new Error(`User with ID ${userId} is not active`);
    }

    return {
      ...userData,
      createdAt:
        (userData.createdAt as any)?.toDate?.()?.toLocaleString() ||
        userData.createdAt,
      updatedAt:
        (userData.updatedAt as any)?.toDate?.()?.toLocaleString() ||
        userData.updatedAt,
    } as User;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/model/User";
import admin from "firebase-admin";

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
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken.role) {
      throw new Error("Unauthorized: Role not found in token");
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
      // Pass 'true' to checkRevoked to ensure disabled users are blocked
      const decodedIdToken = await adminAuth.verifyIdToken(token, true);

      // Check role from Custom Claims
      const role = decodedIdToken.role;

      if (!role) {
        console.warn("Authorization Failed! No role in token.");
        return false;
      }

      if (role === "ADMIN" || role === "OWNER") {
        return true;
      } else {
        console.warn(`User role '${role}' is not authorized!`);
        return false;
      }
    } else {
      console.warn("Authorization Failed! No token.");
      return false;
    }
  } catch (e) {
    console.error("Authorization Error:", e);
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
      const decodedIdToken = await adminAuth.verifyIdToken(token, true);
      const role = decodedIdToken.role;

      // 1. Quick check using Custom Claims
      if (!role || (role !== "ADMIN" && role !== "OWNER")) {
        console.warn(`User role '${role}' is not authorized!`);
        return null;
      }

      // 2. Fetch full user details from Firestore (needed for return value)
      const userDoc = await adminFirestore
        .collection("users")
        .doc(decodedIdToken.uid)
        .get();

      if (!userDoc.exists) {
        console.warn("User not found!");
        return null;
      }

      const userData = userDoc.data() as User;

      // Double check status, though revoked token should have caught this.
      if (userData.status === "Inactive") {
        console.warn("User is inactive!");
        return null;
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

// --- User Management (CRUD) ---

export const createUser = async (user: User): Promise<string> => {
  let userId = user.userId;

  // 1. Create in Firebase Auth
  if (!userId || user.password) {
    try {
      const authUser = await adminAuth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.username,
        photoURL: user.photoURL,
        disabled: user.status === "Inactive",
      });
      userId = authUser.uid;
    } catch (error: any) {
      // If user uses existing email, try to retrieve uid
      if (error.code === "auth/email-already-exists") {
        const existingUser = await adminAuth.getUserByEmail(user.email);
        userId = existingUser.uid;
      } else {
        throw error;
      }
    }
  }

  // 2. Prepare Firestore data (Profile Storage)
  const { password, currentPassword, ...userData } = user;
  const finalUser: User = {
    ...userData,
    userId,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // 3. Sync Profile to Firestore
  await adminFirestore.collection("users").doc(userId).set(finalUser);

  // 4. Set Custom Claims for Auth
  if (user.role) {
    await adminAuth.setCustomUserClaims(userId, { role: user.role });
  }

  return userId;
};

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  // 1. Update Firestore (Profile)
  await adminFirestore
    .collection("users")
    .doc(userId)
    .update({
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    });

  // 2. Sync with Firebase Auth (Identity)
  const updates: any = {};
  if (data.status) {
    updates.disabled = data.status === "Inactive";
  }
  if (data.email) {
    updates.email = data.email;
  }
  if (data.username) {
    updates.displayName = data.username;
  }
  if (data.password) {
    updates.password = data.password;
  }

  if (Object.keys(updates).length > 0) {
    await adminAuth.updateUser(userId, updates);
  }

  // 3. Update Custom Claims if role changed
  if (data.role) {
    await adminAuth.setCustomUserClaims(userId, { role: data.role });
  }
};

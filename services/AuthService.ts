import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/model/User";
import admin from "firebase-admin";
import { AppError, errorResponse } from "@/utils/apiResponse";

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
    throw new AppError("Authorization Failed", 401);
  }
};

export const verifyPosAuth = async () => {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized: Missing or invalid token", 401);
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken.role) {
      throw new AppError("Unauthorized: Role not found in token", 401);
    }

    return decodedToken;
  } catch (error: any) {
    console.error("Token verification failed:", error);
    throw new AppError("Unauthorized: Invalid token or user", 401);
  }
};

export const handleAuthError = (error: any) => {
  const status = error instanceof AppError ? error.statusCode : 500;
  return errorResponse(error, status);
};

export const authorizeRequest = async (
  req: any,
  requiredPermission?: string
) => {
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

      // Super Admin has all permissions
      if (role === "ADMIN") {
        return true;
      }

      if (requiredPermission) {
        // Fetch Role from Firestore to check permissions
        const roleDoc = await adminFirestore
          .collection("roles")
          .doc(role)
          .get();
        if (!roleDoc.exists) {
          console.warn(`Role '${role}' not found in database.`);
          return false;
        }

        const roleData = roleDoc.data();
        if (
          roleData?.permissions &&
          roleData.permissions.includes(requiredPermission)
        ) {
          return true;
        } else {
          console.warn(
            `User with role '${role}' does not have permission '${requiredPermission}'`
          );
          return false;
        }
      } else {
        // If no specific permission required, we default to blocking non-admins
        // (Access limited to ADMIN or explicit permission grant)
        console.warn(
          `User role '${role}' is not authorized for generic access!`
        );
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
// Duplicate catch block removed

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
      if (!role) {
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
      if (userData.status === false) {
        console.warn("User is inactive!");
        return null;
      }

      // 3. Fetch permissions if not ADMIN
      let permissions: string[] = [];
      if (userData.role === "ADMIN") {
        // ADMIN gets all permissions implicitly, but we can ideally leave this empty
        // and handle it in the checking logic (authorizeRequest already does this).
        // For frontend convenience, we might want to pass a flag or just rely on role check.
        // Let's pass a specific permission "ALL" or just rely on 'role' in frontend.
      } else if (userData.role) {
        try {
          // We need to fetch the role document to get permissions
          const roleDoc = await adminFirestore
            .collection("roles")
            .doc(userData.role)
            .get();
          if (roleDoc.exists) {
            permissions = roleDoc.data()?.permissions || [];
          }
        } catch (e) {
          console.warn("Failed to fetch role permissions", e);
        }
      }

      return {
        ...userData,
        permissions: permissions,
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
      throw new AppError(`User with ID ${userId} not found`, 404);
    }

    const userData = userDoc.data() as any;

    if (userData.status !== "Active") {
      throw new AppError(`User with ID ${userData.email} is not active`, 403);
    }

    // Fetch permissions if not ADMIN
    let permissions: string[] = [];
    if (userData.role === "admin") {
      // ADMIN gets all permissions implicitly
    } else if (userData.role) {
      try {
        const roleDoc = await adminFirestore
          .collection("roles")
          .doc(userData.role)
          .get();
        if (roleDoc.exists) {
          permissions = roleDoc.data()?.permissions || [];
        }
      } catch (e) {
        console.warn("Failed to fetch role permissions", e);
      }
    }

    return {
      ...userData,
      permissions,
      createdAt:
        (userData.createdAt as any)?.toDate?.()?.toLocaleString() ||
        userData.createdAt,
      updatedAt:
        (userData.updatedAt as any)?.toDate?.()?.toLocaleString() ||
        userData.updatedAt,
    } as User;
  } catch (e) {
    console.error(e);
    if (e instanceof AppError) throw e;
    throw new AppError(e instanceof Error ? e.message : "Login failed", 500);
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
        disabled: user.status === false,
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
  if (typeof data.status === "boolean") {
    updates.disabled = data.status === false;
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

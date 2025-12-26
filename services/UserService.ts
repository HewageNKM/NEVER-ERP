import { adminFirestore } from "@/firebase/firebaseAdmin";
import { User } from "@/model/User";
import admin from "firebase-admin";

const COLLECTION = "users";

export const addNewUser = async (user: User): Promise<string> => {
  let userId = user.userId;

  // 1. Create in Firebase Auth if password is provided or if userId is missing
  if (!userId || user.password) {
    try {
      const authUser = await admin.auth().createUser({
        email: user.email,
        password: user.password,
        displayName: user.username,
        photoURL: user.photoURL,
        disabled: user.status === "Inactive",
      });
      userId = authUser.uid;
    } catch (error: any) {
      // If user already exists in Auth, try to find them
      if (error.code === "auth/email-already-exists") {
        const existingUser = await admin.auth().getUserByEmail(user.email);
        userId = existingUser.uid;
      } else {
        throw error;
      }
    }
  }

  // 2. Prepare Firestore data
  // Remove password from firestore data
  const { password, currentPassword, ...userData } = user;

  const finalUser: User = {
    ...userData,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await adminFirestore.collection(COLLECTION).doc(userId).set(finalUser);
  return userId;
};

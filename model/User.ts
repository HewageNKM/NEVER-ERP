import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  password?: string;
  currentPassword?: string;
  status: "Active" | "Inactive" | "Pending";

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  photoURL?: string;
}

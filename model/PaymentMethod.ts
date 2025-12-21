import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface PaymentMethod {
  paymentId: string;
  name: string;
  description: string;
  fee: number;
  status: "Active" | "Inactive";
  available: string[];

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

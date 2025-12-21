import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Expense {
  id: string;
  type: string;
  for: string;
  amount: number;
  note?: string;
  createdAt: Timestamp | string;
}

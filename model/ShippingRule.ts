import { Timestamp } from "firebase-admin/firestore";

export interface ShippingRule {
  id: string;
  name: string;
  minWeight: number; // in kg (inclusive)
  maxWeight: number; // in kg (exclusive or inclusive depending on logic, let's say < maxWeight)
  rate: number; // Cost in LKR
  isActive: boolean;

  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

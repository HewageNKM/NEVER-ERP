import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export type AdjustmentType =
  | "add"
  | "remove"
  | "damage"
  | "return"
  | "transfer";

export interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName?: string;
  destinationStockId?: string; // For transfers
  destinationStockName?: string;
}

export interface InventoryAdjustment {
  id?: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  adjustedBy?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

export const ADJUSTMENT_TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-100 text-green-800",
  remove: "bg-red-100 text-red-800",
  damage: "bg-orange-100 text-orange-800",
  return: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Coupon {
  id: string;
  code: string; // User-facing code (e.g., "SAVE20")
  name: string;
  description: string;

  // Discount
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  maxDiscount?: number; // Cap for percentage

  // Conditions
  minOrderAmount?: number;
  minQuantity?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];

  // Limits
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;

  // Validity
  startDate: Timestamp | string;
  endDate: Timestamp | string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";

  // Users
  restrictedToUsers?: string[]; // User IDs (empty = all users)
  firstOrderOnly?: boolean;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;

  // Soft delete
  isDeleted?: boolean;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountApplied: number;
  usedAt: Timestamp | string;
}

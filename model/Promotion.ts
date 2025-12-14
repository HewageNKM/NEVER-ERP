import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "COMBO" | "BOGO" | "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED";

  // Timing
  startDate: Timestamp | string;
  endDate: Timestamp | string;

  // Rules
  conditions: PromotionCondition[];
  actions: PromotionAction[];

  // Limits
  usageLimit?: number; // Total uses allowed
  usageCount: number; // Current usage
  perUserLimit?: number; // Uses per customer

  // Targeting
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Category names
  applicableBrands?: string[]; // Brand names
  excludedProducts?: string[];

  // Stacking
  stackable: boolean;
  priority: number;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface PromotionCondition {
  type:
    | "MIN_QUANTITY"
    | "MIN_AMOUNT"
    | "SPECIFIC_PRODUCT"
    | "CATEGORY"
    | "CUSTOMER_TAG";
  value: string | number;
  productIds?: string[];
}

export interface PromotionAction {
  type: "PERCENTAGE_OFF" | "FIXED_OFF" | "FREE_ITEM" | "FREE_SHIPPING" | "BOGO";
  value: number; // Discount value
  freeProductId?: string; // For free item promotions
  maxDiscount?: number; // Cap for percentage discounts
}

import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

import { PettyCash } from "./PettyCash";
export * from "./PettyCash";
export * from "./Promotion";
export * from "./Coupon";
export * from "./ComboProduct";

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

export interface SMS {
  id: string;
  to: string;
  text: string;
  sentAt: string;
}

export interface Email {
  emailId?: string;
  to: string;
  message?: {
    subject: string;
    text?: string;
    html?: string;
  };
  template?: {
    name: string;
    data: {};
  };
  status?: string;
  time?: string;
}

export interface PopularItem {
  item: Item;
  soldCount: number;
}

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

export interface Item {
  itemId: string;
  type: string;
  category: string;
  brand: string;
  description: string;
  thumbnail: Img;
  variants: Variant[];
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  marketPrice: number;
  discount: number;
  tags: string[];

  listing: "Active" | "Inactive";
  status: "Active" | "Inactive";

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Size {
  size: string;
  stock: number;
}

export interface Variant {
  variantId: string;
  variantName: string;
  images: Img[];
  sizes: Size[];
}

export interface Img {
  url: string;
  file: string;
}

export interface Order {
  userId: string | null;
  orderId: string;
  paymentId: string;
  items: OrderItem[];
  paymentStatus: string;
  paymentMethod: string;
  paymentMethodId: string;
  total: number;
  status: string;
  shippingFee: number;
  transactionFeeCharge: number;
  fee: number;
  customer?: Customer;
  discount: number;
  from: string;
  stockId?: string;
  integrity: boolean;
  paymentReceived?: Payment[];

  // Promotion & Coupon tracking
  couponCode?: string;
  appliedCouponId?: string | null;
  appliedPromotionId?: string | null; // Primary promotion (backward compat)
  appliedPromotionIds?: string[]; // All stacked promotion IDs
  couponDiscount?: number;
  promotionDiscount?: number;

  // Order Tracking
  trackingNumber?: string;
  estimatedDelivery?: Timestamp | string;
  statusHistory?: { status: string; date: Timestamp | string }[];

  restockedAt?: Timestamp | string;
  restocked?: boolean;
  cleanupProcessed?: boolean;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface Payment {
  amount: number;
  paymentMethod: string;
  paymentMethodId?: string;
  id: string;
  cardNumber: string;
}
export interface ExpensesReport {
  type: "expenses" | "utility";
  data: { for: string; amount: number }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;

  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingPhone?: string;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface Expense {
  id: string;
  type: string;
  for: string;
  amount: number;
  note?: string;
  createdAt: Timestamp | string;
}

export interface SalesReport {
  type: "shoes" | "sandals" | "accessories";
  data: [
    {
      itemId: string;
      manufacturer: string;
      brand: string;
      itemName: string;
      data: [
        {
          variantId: string;
          variantName: string;
          data: [
            {
              size: string;
              quantity: number;
              soldPrice: number;
              boughtPrice: number;

              totalSale: number;
              totalCost: number;
              totalProfit: number;
            }
          ];
        }
      ];
    }
  ];
}

export interface CashFlowReport {
  method: string;
  fee: number;
  total: number;
}

export interface StocksReport {
  type: "shoes" | "sandals" | "accessories";
  data: [
    {
      itemId: string;
      manufacturer: string;
      brand: string;
      itemName: string;
      data: [
        {
          variantId: string;
          variantName: string;
          stock: Size[];
        }
      ];
    }
  ];
}

export interface OrderItem {
  itemId: string;
  variantId: string;
  name: string;
  variantName: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
  itemType?: "PRODUCT" | "COMBO" | "combo";
  bPrice?: number; // Buying price for profit calculation
  comboId?: string; // Parent combo bundle ID
  comboName?: string; // Parent combo bundle name
  isComboItem?: boolean; // Flag for combo bundle items
}

export interface Error {
  id: string;
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

import { Timestamp } from "firebase-admin/firestore";

export interface ExpenseCategory {
  id?: string;
  name: string;
  description?: string;
  type: "expense" | "income";
  status: boolean;
  isDeleted?: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Salaries",
  "Maintenance",
  "Insurance",
  "Professional Services",
  "Miscellaneous",
];

export const DEFAULT_INCOME_CATEGORIES = [
  "Sales Revenue",
  "Service Revenue",
  "Interest Income",
  "Refunds Received",
  "Other Income",
];

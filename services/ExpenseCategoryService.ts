import { adminFirestore } from "@/firebase/firebaseAdmin";
import { ExpenseCategory } from "@/model/ExpenseCategory";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

const COLLECTION = "expense_categories";

/**
 * Get all expense categories
 */
export const getExpenseCategories = async (
  type?: "expense" | "income",
  status?: boolean
): Promise<ExpenseCategory[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    if (type) {
      query = query.where("type", "==", type);
    }

    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("name", "asc");

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ExpenseCategory[];
  } catch (error) {
    console.error("[ExpenseCategoryService] Error fetching categories:", error);
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getExpenseCategoryById = async (
  id: string
): Promise<ExpenseCategory | null> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists || doc.data()?.isDeleted) return null;
    return { id: doc.id, ...doc.data() } as ExpenseCategory;
  } catch (error) {
    console.error("[ExpenseCategoryService] Error fetching category:", error);
    throw error;
  }
};

/**
 * Create expense category
 */
export const createExpenseCategory = async (
  data: Omit<ExpenseCategory, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<ExpenseCategory> => {
  try {
    const id = `ec-${nanoid(8)}`;

    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .set({
        ...data,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return { id, ...data };
  } catch (error) {
    console.error("[ExpenseCategoryService] Error creating category:", error);
    throw error;
  }
};

/**
 * Update expense category
 */
export const updateExpenseCategory = async (
  id: string,
  data: Partial<ExpenseCategory>
): Promise<ExpenseCategory> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);

    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await docRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await getExpenseCategoryById(id);
    if (!updated) throw new Error("Category not found after update");

    return updated;
  } catch (error) {
    console.error("[ExpenseCategoryService] Error updating category:", error);
    throw error;
  }
};

/**
 * Delete expense category (soft delete)
 */
export const deleteExpenseCategory = async (id: string): Promise<void> => {
  try {
    await adminFirestore.collection(COLLECTION).doc(id).update({
      isDeleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[ExpenseCategoryService] Error deleting category:", error);
    throw error;
  }
};

/**
 * Get categories dropdown
 */
export const getExpenseCategoriesDropdown = async (
  type?: "expense" | "income"
): Promise<{ id: string; label: string }[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true);

    if (type) {
      query = query.where("type", "==", type);
    }

    query = query.orderBy("name", "asc");

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
  } catch (error) {
    console.error("[ExpenseCategoryService] Error fetching dropdown:", error);
    return [];
  }
};

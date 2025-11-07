import { adminFirestore } from "@/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

export interface Category {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "categories";

// CREATE
export const createCategory = async (category: Category) => {
  try {
    const id = `c-${nanoid(8)}`.toLowerCase(); // generates a short 8-character unique ID
    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .set({
        ...category,
        id,
        active: category.active ?? true,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    return { success: true, id };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { success: false, message: "Failed to create category" };
  }
};

export const getCategories = async ({
  page = 1,
  size = 10,
  search = "",
  status,
}: {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "inactive" | null;
}) => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    // Apply status filter
    if (status === "active") query = query.where("active", "==", true);
    if (status === "inactive") query = query.where("active", "==", false);

    // Apply search filter
    if (search.trim()) {
      const s = search.trim();
      query = query.where("name", ">=", s).where("name", "<=", s + "\uf8ff");
    }

    // Pagination
    const offset = (page - 1) * size;
    const snapshot = await query.offset(offset).limit(size).get();

    const categories: Category[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Category),
    }));

    // Total count (optional)
    let totalQuery: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);
    if (status === "active")
      totalQuery = totalQuery.where("active", "==", true);
    if (status === "inactive")
      totalQuery = totalQuery.where("active", "==", false);
    if (search.trim()) {
      const s = search.trim();
      totalQuery = totalQuery
        .where("name", ">=", s)
        .where("name", "<=", s + "\uf8ff");
    }
    const totalSnapshot = await totalQuery.get();

    return {
      dataList: categories,
      rowCount: totalSnapshot.size,
    };
  } catch (error) {
    console.error("Get Categories Error:", error);
    return { dataList: [], rowCount: 0 };
  }
};

// READ single
export const getCategoryById = async (id: string) => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists || doc.data()?.isDeleted) return null;
    return { id: doc.id, ...(doc.data() as Category) };
  } catch (error) {
    console.error("Get Category By ID Error:", error);
    return null;
  }
};

// UPDATE
export const updateCategory = async (id: string, data: Partial<Category>) => {
  try {
    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Update Category Error:", error);
    return { success: false, message: "Failed to update category" };
  }
};

// SOFT DELETE
export const softDeleteCategory = async (id: string) => {
  try {
    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .update({ isDeleted: true, updatedAt: FieldValue.serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Soft Delete Error:", error);
    return { success: false, message: "Failed to delete category" };
  }
};

// RESTORE
export const restoreCategory = async (id: string) => {
  try {
    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .update({ isDeleted: false, updatedAt: FieldValue.serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Restore Category Error:", error);
    return { success: false, message: "Failed to restore category" };
  }
};

export const getCategoriesForDropdown = async () => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
    return categories;
  } catch (error) {
    console.log(error);
    return [];
  }
};

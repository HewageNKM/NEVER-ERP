import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Supplier } from "@/model/Supplier";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "suppliers";

/**
 * Get all suppliers
 */
export const getSuppliers = async (
  status?: "active" | "inactive"
): Promise<Supplier[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTION);

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("name", "asc");

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Supplier[];
  } catch (error) {
    console.error("[SupplierService] Error fetching suppliers:", error);
    throw error;
  }
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Supplier;
  } catch (error) {
    console.error("[SupplierService] Error fetching supplier:", error);
    throw error;
  }
};

/**
 * Create new supplier
 */
export const createSupplier = async (
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">
): Promise<Supplier> => {
  try {
    const docRef = await adminFirestore.collection(COLLECTION).add({
      ...supplier,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...supplier,
    };
  } catch (error) {
    console.error("[SupplierService] Error creating supplier:", error);
    throw error;
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  id: string,
  updates: Partial<Supplier>
): Promise<Supplier> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);

    const updateData = { ...updates };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await docRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await getSupplierById(id);
    if (!updated) throw new Error("Supplier not found after update");

    return updated;
  } catch (error) {
    console.error("[SupplierService] Error updating supplier:", error);
    throw error;
  }
};

/**
 * Delete supplier (soft delete by setting status to inactive)
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    await adminFirestore.collection(COLLECTION).doc(id).update({
      status: "inactive",
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[SupplierService] Error deleting supplier:", error);
    throw error;
  }
};

/**
 * Get suppliers dropdown list
 */
export const getSuppliersDropdown = async (): Promise<
  { id: string; label: string }[]
> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("status", "==", "active")
      .orderBy("name", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
  } catch (error) {
    console.error(
      "[SupplierService] Error fetching suppliers dropdown:",
      error
    );
    throw error;
  }
};

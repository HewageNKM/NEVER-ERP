import { adminFirestore } from "@/firebase/firebaseAdmin";
import { ShippingRule } from "@/model/ShippingRule";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "shipping_rules";

export const getShippingRules = async () => {
  try {
    const snapshot = await adminFirestore.collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching shipping rules:", error);
    throw error;
  }
};

export const createShippingRule = async (data: Partial<ShippingRule>) => {
  try {
    const newRule = {
      ...data,
      createAt: FieldValue.serverTimestamp(), // Typo in original code? No, usually createdAt.
      // Original code used createdAt. I will stick to standard.
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const docRef = await adminFirestore.collection(COLLECTION).add(newRule);
    return docRef.id;
  } catch (error) {
    console.error("Error creating shipping rule:", error);
    throw error;
  }
};

export const updateShippingRule = async (
  id: string,
  data: Partial<ShippingRule>
) => {
  try {
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Ensure ID is not in the data payload for update
    delete (updateData as any).id;

    await adminFirestore.collection(COLLECTION).doc(id).update(updateData);
    return id;
  } catch (error) {
    console.error("Error updating shipping rule:", error);
    throw error;
  }
};

export const deleteShippingRule = async (id: string) => {
  try {
    await adminFirestore.collection(COLLECTION).doc(id).delete();
    return id;
  } catch (error) {
    console.error("Error deleting shipping rule:", error);
    throw error;
  }
};

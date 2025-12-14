import { adminFirestore } from "@/firebase/firebaseAdmin";
import { ComboProduct } from "@/model";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { toSafeLocaleString } from "./UtilService";

const COMBOS_COLLECTION = "combo_products";

export const getCombos = async (
  pageNumber: number = 1,
  size: number = 20
): Promise<{ dataList: ComboProduct[]; rowCount: number }> => {
  try {
    let query = adminFirestore
      .collection(COMBOS_COLLECTION)
      .orderBy("createdAt", "desc");

    const offset = (pageNumber - 1) * size;
    const snapshot = await query.offset(offset).limit(size).get();

    const allDocs = await adminFirestore
      .collection(COMBOS_COLLECTION)
      .count()
      .get();
    const rowCount = allDocs.data().count;

    const dataList = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<ComboProduct, "id">;
      return {
        id: doc.id,
        ...data,
        createdAt: toSafeLocaleString(data.createdAt) || "",
        updatedAt: toSafeLocaleString(data.updatedAt) || "",
        startDate: toSafeLocaleString(data.startDate) || "",
        endDate: toSafeLocaleString(data.endDate) || "",
      };
    });

    return { dataList, rowCount };
  } catch (error) {
    console.error("Error getting combos:", error);
    throw error;
  }
};

export const createCombo = async (
  data: Omit<ComboProduct, "id" | "updatedAt" | "createdAt">
): Promise<ComboProduct> => {
  const docId = `combo-${nanoid(10)}`;
  const now = FieldValue.serverTimestamp();

  const newCombo = {
    ...data,
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
    createdAt: now,
    updatedAt: now,
  };

  await adminFirestore.collection(COMBOS_COLLECTION).doc(docId).set(newCombo);

  return { id: docId, ...newCombo } as unknown as ComboProduct;
};

export const updateCombo = async (
  id: string,
  data: Partial<ComboProduct>
): Promise<void> => {
  // Remove createdAt to prevent overwriting with malformed data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, ...updateData } = data;

  const payload: any = {
    ...updateData,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updateData.startDate) {
    payload.startDate = new Date(updateData.startDate as any);
  }
  if (updateData.endDate) {
    payload.endDate = new Date(updateData.endDate as any);
  }

  await adminFirestore.collection(COMBOS_COLLECTION).doc(id).update(payload);
};

export const deleteCombo = async (id: string): Promise<void> => {
  await adminFirestore.collection(COMBOS_COLLECTION).doc(id).delete();
};

export const getComboById = async (
  id: string
): Promise<ComboProduct | null> => {
  const doc = await adminFirestore.collection(COMBOS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as ComboProduct;
  return {
    id: doc.id,
    ...data,
    createdAt: toSafeLocaleString(data.createdAt) || "",
    updatedAt: toSafeLocaleString(data.updatedAt) || "",
    startDate: toSafeLocaleString(data.startDate) || "",
    endDate: toSafeLocaleString(data.endDate) || "",
  } as ComboProduct;
};

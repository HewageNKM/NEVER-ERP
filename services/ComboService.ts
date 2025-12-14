import { adminFirestore, adminStorageBucket } from "@/firebase/firebaseAdmin";
import { ComboProduct } from "@/model";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { toSafeLocaleString } from "./UtilService";

const COMBOS_COLLECTION = "combo_products";
const BUCKET = adminStorageBucket;

const uploadThumbnail = async (
  file: File,
  id: string
): Promise<ComboProduct["thumbnail"]> => {
  const filePath = `combos/${id}/thumbnail/${file.name}`;
  const fileRef = BUCKET.file(filePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${BUCKET.name}/${filePath}`;

  return {
    url: url,
    file: filePath,
  };
};

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
  data: Omit<ComboProduct, "id" | "updatedAt" | "createdAt" | "thumbnail">,
  file?: File
): Promise<ComboProduct> => {
  const docId = `combo-${nanoid(10)}`;
  const now = FieldValue.serverTimestamp();

  let thumbnail;
  if (file) {
    thumbnail = await uploadThumbnail(file, docId);
  }

  const newCombo = {
    ...data,
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
    createdAt: now,
    updatedAt: now,
    thumbnail: thumbnail || null,
  };

  await adminFirestore.collection(COMBOS_COLLECTION).doc(docId).set(newCombo);

  return { id: docId, ...newCombo } as unknown as ComboProduct;
};

export const updateCombo = async (
  id: string,
  data: Partial<ComboProduct>,
  file?: File
): Promise<void> => {
  // Remove createdAt to prevent overwriting with malformed data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, ...updateData } = data;

  let thumbnail = data.thumbnail;

  if (file) {
    const oldCombo = await getComboById(id);
    const oldPath = oldCombo?.thumbnail?.file;
    if (oldPath) {
      try {
        await BUCKET.file(oldPath).delete();
      } catch (delError) {
        console.warn(`Failed to delete old thumbnail: ${oldPath}`, delError);
      }
    }
    thumbnail = await uploadThumbnail(file, id);
  }

  const payload: any = {
    ...updateData,
    thumbnail: thumbnail,
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
    ...data,
    id: doc.id,
    createdAt: toSafeLocaleString(data.createdAt) || "",
    updatedAt: toSafeLocaleString(data.updatedAt) || "",
    startDate: toSafeLocaleString(data.startDate) || "",
    endDate: toSafeLocaleString(data.endDate) || "",
  } as ComboProduct;
};

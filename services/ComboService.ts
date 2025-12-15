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
  // Remove createdAt and thumbnail from data to handle separately
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, thumbnail: existingThumbnail, ...updateData } = data;

  let newThumbnail: ComboProduct["thumbnail"] | undefined;

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
    newThumbnail = await uploadThumbnail(file, id);
  }

  const payload: any = {
    ...updateData,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Only include thumbnail if we have a new one or the existing one is valid
  if (newThumbnail) {
    payload.thumbnail = newThumbnail;
  } else if (existingThumbnail && existingThumbnail.url) {
    payload.thumbnail = existingThumbnail;
  }
  // If no thumbnail data, don't include it in the update (keeps existing value)

  if (updateData.startDate) {
    payload.startDate = new Date(updateData.startDate as any);
  }
  if (updateData.endDate) {
    payload.endDate = new Date(updateData.endDate as any);
  }

  // Remove any undefined values from payload
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

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

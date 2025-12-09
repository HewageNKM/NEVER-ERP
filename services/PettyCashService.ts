import { adminFirestore } from "@/firebase/firebaseAdmin";
import { PettyCash } from "@/model/PettyCash";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase-admin/firestore";
import { uploadFile } from "@/firebase/firebaseAdmin"; // Reusing existing upload function

const COLLECTION_NAME = "petty-cash";

export const addPettyCash = async (
  data: Partial<PettyCash>,
  file?: File
): Promise<PettyCash> => {
  const id = `pc-${nanoid(8)}`;
  let attachmentUrl = "";

  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const now = Timestamp.now();
  const newEntry: PettyCash = {
    id,
    amount: data.amount || 0,
    attachment: attachmentUrl,
    category: data.category || "",
    subCategory: data.subCategory || "",
    subCategoryId: data.subCategoryId || "",
    for: data.for || "",
    note: data.note || "",
    paymentMethod: data.paymentMethod || "cash",
    type: data.type || "expense",
    status: data.status || "PENDING",
    createdBy: data.createdBy || "system",
    createdAt: now,
    updatedBy: data.createdBy || "system",
    updatedAt: now,
    reviewedBy: "",
    reviewedAt: null,
    isDeleted: false,
    ...data, // Allow override but force defaults above if missing
  } as PettyCash;

  await adminFirestore.collection(COLLECTION_NAME).doc(id).set(newEntry);
  return newEntry;
};

export const updatePettyCash = async (
  id: string,
  data: Partial<PettyCash>,
  file?: File
): Promise<PettyCash> => {
  const docRef = adminFirestore.collection(COLLECTION_NAME).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Petty Cash entry with ID ${id} not found`);
  }

  let attachmentUrl = (doc.data() as PettyCash).attachment;

  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const updates = {
    ...data,
    attachment: attachmentUrl,
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updates);

  // Return complete updated object
  const updatedDoc = await docRef.get();
  return updatedDoc.data() as PettyCash;
};

export const getPettyCashList = async (
  page: number = 1,
  size: number = 20,
  filters?: { status?: string; type?: string; category?: string }
): Promise<{ data: PettyCash[]; total: number }> => {
  let query: FirebaseFirestore.Query = adminFirestore
    .collection(COLLECTION_NAME)
    .where("isDeleted", "==", false);

  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters?.type) {
    query = query.where("type", "==", filters.type);
  }
  if (filters?.category) {
    query = query.where("category", "==", filters.category);
  }

  // Get total count for pagination (simplified, for better performance use aggregation queries if available/needed)
  const snapshotInit = await query.get();
  const total = snapshotInit.size;

  query = query
    .orderBy("createdAt", "desc")
    .limit(size)
    .offset((page - 1) * size);

  const snapshot = await query.get();
  const data = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      ...d,
      createdAt:
        d.createdAt instanceof Timestamp
          ? d.createdAt.toDate().toISOString()
          : d.createdAt,
      updatedAt:
        d.updatedAt instanceof Timestamp
          ? d.updatedAt.toDate().toISOString()
          : d.updatedAt,
      reviewedAt:
        d.reviewedAt instanceof Timestamp
          ? d.reviewedAt.toDate().toISOString()
          : d.reviewedAt,
    } as PettyCash;
  });

  return { data, total };
};

export const getPettyCashById = async (
  id: string
): Promise<PettyCash | null> => {
  const doc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data() as PettyCash;

  return {
    ...d,
    createdAt:
      d.createdAt instanceof Timestamp
        ? d.createdAt.toDate().toISOString()
        : d.createdAt,
    updatedAt:
      d.updatedAt instanceof Timestamp
        ? d.updatedAt.toDate().toISOString()
        : d.updatedAt,
    reviewedAt:
      d.reviewedAt instanceof Timestamp
        ? d.reviewedAt.toDate().toISOString()
        : d.reviewedAt,
  } as PettyCash;
};

export const deletePettyCash = async (id: string): Promise<void> => {
  await adminFirestore.collection(COLLECTION_NAME).doc(id).update({
    isDeleted: true,
    updatedAt: Timestamp.now(),
  });
};

import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Promotion, Coupon, CouponUsage } from "@/model";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

const PROMOTIONS_COLLECTION = "promotions";
const COUPONS_COLLECTION = "coupons";
const COUPON_USAGE_COLLECTION = "coupon_usage";

// --- PROMOTIONS CRUD ---

export const getPromotions = async (
  pageNumber: number = 1,
  size: number = 20,
  filterStatus?: string
): Promise<{ dataList: Promotion[]; rowCount: number }> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection(
      PROMOTIONS_COLLECTION
    );

    if (filterStatus) {
      query = query.where("status", "==", filterStatus);
    }

    // Sort by priority and created date
    query = query.orderBy("priority", "desc").orderBy("createdAt", "desc");

    const offset = (pageNumber - 1) * size;
    const snapshot = await query.offset(offset).limit(size).get();

    // Get total count (for pagination) - simplistic approach
    // In production with high volume, consider aggregation queries or counters
    const allDocs = await adminFirestore
      .collection(PROMOTIONS_COLLECTION)
      .get();
    const rowCount = allDocs.size;

    const dataList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Promotion, "id">),
    }));

    return { dataList, rowCount };
  } catch (error) {
    console.error("Error getting promotions:", error);
    throw error;
  }
};

export const createPromotion = async (
  data: Omit<Promotion, "id" | "updatedAt" | "createdAt" | "usageCount">
): Promise<Promotion> => {
  const docId = `promo-${nanoid(10)}`;
  const now = FieldValue.serverTimestamp();

  const newPromo = {
    ...data,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await adminFirestore
    .collection(PROMOTIONS_COLLECTION)
    .doc(docId)
    .set(newPromo);

  return { id: docId, ...newPromo } as unknown as Promotion; // Typecast because Timestamp vs FieldValues
};

export const updatePromotion = async (
  id: string,
  data: Partial<Promotion>
): Promise<void> => {
  await adminFirestore
    .collection(PROMOTIONS_COLLECTION)
    .doc(id)
    .update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
};

export const deletePromotion = async (id: string): Promise<void> => {
  await adminFirestore.collection(PROMOTIONS_COLLECTION).doc(id).delete();
};

export const getPromotionById = async (
  id: string
): Promise<Promotion | null> => {
  const doc = await adminFirestore
    .collection(PROMOTIONS_COLLECTION)
    .doc(id)
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Promotion;
};

// --- COUPONS CRUD ---

export const getCoupons = async (
  pageNumber: number = 1,
  size: number = 20
): Promise<{ dataList: Coupon[]; rowCount: number }> => {
  // Similar pagination logic
  let query = adminFirestore
    .collection(COUPONS_COLLECTION)
    .orderBy("createdAt", "desc");

  const offset = (pageNumber - 1) * size;
  const snapshot = await query.offset(offset).limit(size).get();

  // Total count
  const allDocs = await adminFirestore
    .collection(COUPONS_COLLECTION)
    .count()
    .get();
  const rowCount = allDocs.data().count;

  const dataList = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Coupon)
  );

  return { dataList, rowCount };
};

export const createCoupon = async (
  data: Omit<Coupon, "id" | "updatedAt" | "createdAt" | "usageCount">
): Promise<Coupon> => {
  const docId = `cpn-${nanoid(8)}`;
  const now = FieldValue.serverTimestamp();

  // Check code uniqueness
  const existing = await adminFirestore
    .collection(COUPONS_COLLECTION)
    .where("code", "==", data.code)
    .get();
  if (!existing.empty) {
    throw new Error("Coupon code already exists");
  }

  const newCoupon = {
    ...data,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await adminFirestore.collection(COUPONS_COLLECTION).doc(docId).set(newCoupon);
  return { id: docId, ...newCoupon } as unknown as Coupon;
};

export const updateCoupon = async (
  id: string,
  data: Partial<Coupon>
): Promise<void> => {
  await adminFirestore
    .collection(COUPONS_COLLECTION)
    .doc(id)
    .update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
};

export const deleteCoupon = async (id: string): Promise<void> => {
  await adminFirestore.collection(COUPONS_COLLECTION).doc(id).delete();
};

export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  const snapshot = await adminFirestore
    .collection(COUPONS_COLLECTION)
    .where("code", "==", code)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Coupon;
};

// --- VALIDATION & LOGIC (Advanced Phase) ---

// Placeholder for validating a coupon against a cart context
export const validateCoupon = async (
  code: string,
  userId: string | null,
  cartTotal: number,
  cartItems: any[]
): Promise<{
  valid: boolean;
  discount?: number;
  message?: string;
  coupon?: Coupon;
}> => {
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (coupon.status !== "ACTIVE") {
    return { valid: false, message: "Coupon is not active" };
  }

  // Date checks (assuming Timestamp - would need conversion logic in real app)
  // Limits checks

  // Basic validation passed
  return { valid: true, discount: coupon.discountValue, coupon };
};

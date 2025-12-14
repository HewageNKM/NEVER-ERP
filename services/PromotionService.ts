import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Promotion, Coupon, CouponUsage } from "@/model";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { toSafeLocaleString } from "./UtilService";

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

    const dataList = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Promotion, "id">;
      return {
        id: doc.id,
        ...data,
        startDate: toSafeLocaleString(data.startDate) || "",
        endDate: toSafeLocaleString(data.endDate) || "",
        createdAt: toSafeLocaleString(data.createdAt) || "",
        updatedAt: toSafeLocaleString(data.updatedAt) || "",
      };
    });

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
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
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
  // Remove createdAt to prevent overwriting with malformed data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, ...updateData } = data;

  console.log("Updating Promotion ID:", id, "With Data:", updateData); // DEBUG log

  const payload: any = {
    ...updateData,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updateData.startDate) {
    payload.startDate = new Date(updateData.startDate as any);
    console.log("Converted StartDate:", payload.startDate); // DEBUG
  }
  if (updateData.endDate) {
    payload.endDate = new Date(updateData.endDate as any);
    console.log("Converted EndDate:", payload.endDate); // DEBUG
  }

  await adminFirestore
    .collection(PROMOTIONS_COLLECTION)
    .doc(id)
    .update(payload);
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
  const data = doc.data() as Promotion;
  return {
    id: doc.id,
    ...data,
    startDate: toSafeLocaleString(data.startDate) || "",
    endDate: toSafeLocaleString(data.endDate) || "",
    createdAt: toSafeLocaleString(data.createdAt) || "",
    updatedAt: toSafeLocaleString(data.updatedAt) || "",
  } as Promotion; // Cast to Promotion to satisfy strict checks if needed
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

  const dataList = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Coupon, "id">;
    return {
      id: doc.id,
      ...data,
      startDate: toSafeLocaleString(data.startDate) || "",
      endDate: toSafeLocaleString(data.endDate) || "",
      createdAt: toSafeLocaleString(data.createdAt) || "",
      updatedAt: toSafeLocaleString(data.updatedAt) || "",
    };
  });

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
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
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

  await adminFirestore.collection(COUPONS_COLLECTION).doc(id).update(payload);
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
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data() as Coupon;
  return {
    id: doc.id,
    ...data,
    startDate: toSafeLocaleString(data.startDate) || "",
    endDate: toSafeLocaleString(data.endDate) || "",
    createdAt: toSafeLocaleString(data.createdAt) || "",
    updatedAt: toSafeLocaleString(data.updatedAt) || "",
  } as Coupon;
};

// --- VALIDATION & LOGIC (Advanced Phase) ---

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  discount?: number;
}

/**
 * Validates a coupon against the current cart and user context.
 */
export const validateCoupon = async (
  code: string,
  userId: string | null,
  cartTotal: number,
  cartItems: CartItem[]
): Promise<{
  valid: boolean;
  discount: number;
  message?: string;
  coupon?: Coupon;
}> => {
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { valid: false, discount: 0, message: "Invalid coupon code" };
  }

  // 1. Status Check
  if (coupon.status !== "ACTIVE") {
    return { valid: false, discount: 0, message: "Coupon is not active" };
  }

  // 2. Date Check
  const now = new Date();
  const startDate =
    coupon.startDate instanceof Timestamp
      ? coupon.startDate.toDate()
      : new Date(coupon.startDate as string);
  const endDate = coupon.endDate
    ? coupon.endDate instanceof Timestamp
      ? coupon.endDate.toDate()
      : new Date(coupon.endDate as string)
    : null;

  if (now < startDate) {
    return { valid: false, discount: 0, message: "Coupon has not started yet" };
  }
  if (endDate && now > endDate) {
    return { valid: false, discount: 0, message: "Coupon has expired" };
  }

  // 3. Usage Limits
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: "Coupon usage limit reached" };
  }

  // 4. User Restriction
  if (coupon.restrictedToUsers && coupon.restrictedToUsers.length > 0) {
    if (!userId || !coupon.restrictedToUsers.includes(userId)) {
      return {
        valid: false,
        discount: 0,
        message: "This coupon is not valid for your account",
      };
    }
  }

  // 5. Per User Limit (Requires checking Usage History - skipped for now unless user provides usage history)
  if (userId && coupon.perUserLimit) {
    const userUsageCount = await getUserCouponUsageCount(coupon.id, userId);
    if (userUsageCount >= coupon.perUserLimit) {
      return {
        valid: false,
        discount: 0,
        message: "You have already used this coupon",
      };
    }
  }

  // 6. Minimum Order Amount
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order amount of ${coupon.minOrderAmount} required`,
    };
  }

  // 7. Calculate Discount
  let discountAmount = 0;
  if (coupon.discountType === "FIXED") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === "FREE_SHIPPING") {
    // Logic for free shipping usually handled separately or returns specific flag
    // Here we act as if shipping cost is separate, so maybe discount is 0 on cartItems but flag is set
    // For simplicity, returning 0 discount value but valid coupon
    discountAmount = 0;
  }

  return { valid: true, discount: discountAmount, coupon };
};

/**
 * Helper to check how many times a user used a coupon.
 */
const getUserCouponUsageCount = async (
  couponId: string,
  userId: string
): Promise<number> => {
  const snapshot = await adminFirestore
    .collection(COUPON_USAGE_COLLECTION)
    .where("couponId", "==", couponId)
    .where("userId", "==", userId)
    .count()
    .get();
  return snapshot.data().count;
};

/**
 * Tracks the usage of a coupon after a successful order.
 */
export const trackCouponUsage = async (
  couponId: string,
  userId: string,
  orderId: string,
  discountApplied: number
) => {
  const usageRef = adminFirestore.collection(COUPON_USAGE_COLLECTION).doc();
  await usageRef.set({
    id: usageRef.id,
    couponId,
    userId,
    orderId,
    discountApplied,
    usedAt: FieldValue.serverTimestamp(),
  });

  // Increment global usage count atomically
  await adminFirestore
    .collection(COUPONS_COLLECTION)
    .doc(couponId)
    .update({
      usageCount: FieldValue.increment(1),
    });
};

/**
 * Calculates the best automatic promotion for the cart.
 */
export const calculateCartDiscount = async (
  cartItems: CartItem[],
  cartTotal: number
): Promise<{
  promotion?: Promotion;
  discount: number;
}> => {
  // 1. Fetch active auto-apply promotions (Not type=COUPON ideally, but our type Enum doesn't strictly separate them yet. Assuming all in 'promotions' are auto unless specified)
  // For this system, let's assume 'promotions' collection implies automatic rules unless defined otherwise.

  // Fetch ACTIVE promotions
  const promotionsSnap = await adminFirestore
    .collection(PROMOTIONS_COLLECTION)
    .where("status", "==", "ACTIVE")
    .get();

  const promotions = promotionsSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as Promotion)
  );

  // Sort by priority (high to low)
  promotions.sort((a, b) => b.priority - a.priority);

  let bestDiscount = 0;
  let bestPromotion: Promotion | undefined;

  const now = new Date();

  for (const promo of promotions) {
    // Date Checks
    const startDate =
      promo.startDate instanceof Timestamp
        ? promo.startDate.toDate()
        : new Date(promo.startDate as string);
    const endDate =
      promo.endDate instanceof Timestamp
        ? promo.endDate.toDate()
        : new Date(promo.endDate as string);
    if (now < startDate || now > endDate) continue;

    // Condition Checks
    let conditionsMet = true;
    for (const condition of promo.conditions) {
      if (condition.type === "MIN_AMOUNT") {
        if (cartTotal < Number(condition.value)) conditionsMet = false;
      } else if (condition.type === "MIN_QUANTITY") {
        const totalQty = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        if (totalQty < Number(condition.value)) conditionsMet = false;
      }
      // Add more condition logic here (Specific Product, etc.)
    }

    if (!conditionsMet) continue;

    // Calculate Potential Discount
    let currentDiscount = 0;
    const action = promo.actions[0]; // Assuming single action for now

    if (action.type === "PERCENTAGE_OFF") {
      currentDiscount = (cartTotal * action.value) / 100;
      if (action.maxDiscount && currentDiscount > action.maxDiscount) {
        currentDiscount = action.maxDiscount;
      }
    } else if (action.type === "FIXED_OFF") {
      currentDiscount = action.value;
    }

    // Identify Best Offer (Simple strategy: Highest Discount takes precedence if not stackable)
    if (currentDiscount > bestDiscount) {
      bestDiscount = currentDiscount;
      bestPromotion = promo;
    }

    // If we want stacking, logic gets complex. For now, we take the highest priority valid one.
    // Since we sorted by priority, the first one that matches IS the one we want if we don't scan for "best financial value" but "highest priority rule".
    // If sorting by financial value, we scan all.
    // Let's stick to "Highest Priority Wins" for simplicity and predictability.
    if (conditionsMet && promo.priority > 0) {
      bestDiscount = currentDiscount;
      bestPromotion = promo;
      break; // Stop after finding high priority match
    }
  }

  return { promotion: bestPromotion, discount: bestDiscount };
};

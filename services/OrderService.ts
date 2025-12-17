import { adminFirestore } from "@/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { Order } from "@/model";
import {
  updateOrAddOrderHash,
  validateDocumentIntegrity,
} from "./IntegrityService";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { InventoryItem } from "@/model/InventoryItem";
import { Product } from "@/model/Product";
import { toSafeLocaleString } from "./UtilService";
import { ShippingRule } from "@/model/ShippingRule";

const ORDERS_COLLECTION = "orders";

export const getOrders = async (
  page: number = 1,
  size: number = 20,
  from?: string,
  to?: string,
  status?: string,
  payment?: string,
  orderId?: string
) => {
  try {
    const offset = (page - 1) * size;
    let query = adminFirestore.collection(ORDERS_COLLECTION);
    if (from && to) {
      const startTimestamp = Timestamp.fromDate(new Date(from));
      const endTimestamp = Timestamp.fromDate(new Date(to));
      query = query.where("createdAt", ">=", startTimestamp);
      query = query.where("createdAt", "<=", endTimestamp);
    }
    if (status) {
      query = query.where("status", "==", status);
    }
    if (orderId) {
      query = query.where("orderId", "==", orderId);
    }
    if (payment) {
      query = query.where("paymentStatus", "==", payment);
    }
    const total = (await query.get()).size;
    const ordersSnapshot = await query
      .orderBy("createdAt", "desc")
      .limit(size)
      .offset(offset)
      .get();

    const orders: Order[] = [];
    for (const doc of ordersSnapshot.docs) {
      const data = doc.data() as Order;
      const integrityResult = await validateDocumentIntegrity(
        ORDERS_COLLECTION,
        doc.id
      );

      const order: Order = {
        ...data,
        orderId: doc.id,
        integrity: integrityResult,
        customer: data.customer
          ? {
              ...data.customer,
              updatedAt: data.customer.updatedAt
                ? toSafeLocaleString(data.customer.updatedAt)
                : null,
            }
          : null,
        createdAt: toSafeLocaleString(data.createdAt),
        updatedAt: toSafeLocaleString(data.updatedAt),
        restockedAt: data.restockedAt
          ? toSafeLocaleString(data.restockedAt)
          : null,
      };
      orders.push(order);
    }
    console.log(`Fetched ${orders.length} orders on page ${page}`);
    return {
      dataList: orders,
      total: total,
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    // 1. Changed query to a direct doc.get() for efficiency and consistency
    const doc = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .doc(orderId)
      .get();

    if (!doc.exists) {
      console.warn(`Order with ID ${orderId} not found`);
      return null;
    }

    const data = doc.data() as Order;

    // 2. Passed 'adminFirestore' and used the doc.id for the check
    const integrity = await validateDocumentIntegrity(
      ORDERS_COLLECTION,
      doc.id
    );

    return {
      ...data,
      orderId: doc.id, // 3. Ensure orderId is the doc ID
      integrity: integrity, // 4. Add integrity result
      customer: data.customer
        ? {
            ...data.customer,
            updatedAt: data.customer.updatedAt
              ? toSafeLocaleString(data.customer.updatedAt)
              : null,
          }
        : null,
      createdAt: toSafeLocaleString(data.createdAt),
      updatedAt: toSafeLocaleString(data.updatedAt),
      restockedAt: data.restockedAt
        ? toSafeLocaleString(data.restockedAt)
        : null,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const updateOrder = async (order: Order, orderId: string) => {
  try {
    const orderRef = adminFirestore.collection(ORDERS_COLLECTION).doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) throw new Error(`Order with ID ${orderId} not found`);

    const existingOrder = orderDoc.data() as Order;

    if (existingOrder.paymentStatus?.toLowerCase() === "refunded") {
      throw new Error(
        `Order with ID ${orderId} is already refunded can't proceed with update`
      );
    }

    // 🧾 Update Firestore order
    const orderUpdate = {
      paymentStatus: order.paymentStatus,
      status: order.status,
      updatedAt: FieldValue.serverTimestamp(),
      ...(order.customer && {
        customer: {
          ...order.customer,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
      }),
    };

    await orderRef.set(orderUpdate, { merge: true });

    // ✅ Fetch the final updated data
    const updatedOrderDoc = await orderRef.get();
    const updatedOrderData = updatedOrderDoc.data();

    if (!updatedOrderData) {
      throw new Error(`Order with ID ${orderId} not found after update`);
    }

    // 🔒 Update or add hash ledger entry
    await updateOrAddOrderHash(updatedOrderData);

    console.log(`✅ Order with ID ${orderId} updated and hashed successfully`);
  } catch (error) {
    console.error("❌ Error updating order:", error);
    throw error;
  }
};

import {
  validateCoupon,
  trackCouponUsage,
  calculateCartDiscount,
} from "./PromotionService";

export const addOrder = async (order: Partial<Order>) => {
  if (!order.orderId) throw new Error("Order ID is required");
  if (!order.items?.length) throw new Error("Order items are required");
  if (!order.from) throw new Error("Order 'from' field is required");

  // ... (existing validations) ...

  const fromSource = order.from.toLowerCase();

  // Coupon & Promotion Validation logic (Server Side Trust)
  let finalDiscount = 0;
  let appliedCouponId: string | null = null;
  let promotionDiscount = 0;
  let appliedPromotionId: string | null = null;
  let appliedPromotionIds: string[] = [];

  const orderRef = adminFirestore.collection("orders").doc(order.orderId);
  const now = admin.firestore.Timestamp.now();
  let orderData: Order = { ...order, createdAt: now, updatedAt: now };

  try {
    const productRefs = order.items.map((i) =>
      adminFirestore.collection("products").doc(i.itemId)
    );
    const productSnaps = await adminFirestore.getAll(...productRefs);
    const productMap = new Map(
      productSnaps.map((snap) => [snap.id, snap.data() as Product])
    );

    // Validate Coupon if exists
    if (fromSource === "website" && order.couponCode) {
      // Calculate true cart total based on DB prices, but respecting item-level discounts (e.g. Combos)
      const cartTotal = order.items.reduce((acc, item) => {
        const prod = productMap.get(item.itemId);
        const price = prod ? prod.sellingPrice : 0;
        const discount = item.discount || 0;
        return acc + (price * item.quantity - discount);
      }, 0);

      // Map order items to CartItem format for validation
      const cartItems = order.items.map((i) => ({
        productId: i.itemId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: productMap.get(i.itemId)?.sellingPrice || 0,
        discount: i.discount,
      }));

      const validation = await validateCoupon(
        order.couponCode,
        order.customer?.uid || "guest",
        cartTotal,
        cartItems
      );
      if (!validation.valid) {
        console.warn(
          `Invalid coupon used in order ${order.orderId}: ${validation.message}`
        );
        // Option: Throw error or proceed without discount?
        // Throwing error is safer.
        throw new Error(`Coupon Invalid: ${validation.message}`);
      }

      finalDiscount = validation.discount || 0;
      appliedCouponId = validation.coupon?.id || null;
    }

    // Apply automatic promotions for website orders
    if (fromSource === "website") {
      const cartTotal = order.items.reduce((acc, item) => {
        const prod = productMap.get(item.itemId);
        const price = prod ? prod.sellingPrice : 0;
        const discount = item.discount || 0;
        return acc + (price * item.quantity - discount);
      }, 0);

      const promoResult = await calculateCartDiscount(
        order.items.map((i) => ({
          productId: i.itemId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: productMap.get(i.itemId)?.sellingPrice || 0,
          discount: i.discount,
        })),
        cartTotal - finalDiscount // Apply promo on cart after coupon
      );

      if (promoResult.promotions && promoResult.promotions.length > 0) {
        promotionDiscount = promoResult.totalDiscount;
        appliedPromotionId = promoResult.promotions[0].id; // Primary for backward compat
        appliedPromotionIds = promoResult.promotions.map((p) => p.id);
      }

      // --- SERVER-SIDE TOTAL VALIDATION ---
      // Recalculate total using DB prices to prevent price manipulation
      const SHIPPING_FLAT_RATE_1 = 380; // 1 item
      const SHIPPING_FLAT_RATE_2 = 500; // 2+ items
      const TOLERANCE = 1; // Allow Rs. 1 rounding difference

      // Calculate items total using DB prices
      const itemsTotal = order.items.reduce((acc, item) => {
        const prod = productMap.get(item.itemId);
        const price = prod ? prod.sellingPrice : 0;
        return acc + price * item.quantity;
      }, 0);

      // Calculate item-level discounts (combo discounts, sale prices)
      const itemDiscounts = order.items.reduce(
        (acc, item) => acc + (item.discount || 0),
        0
      );

      // --- COMBO DISCOUNT VALIDATION ---
      // Validate combo discounts by checking against stored combo prices
      const comboItems = order.items.filter(
        (item) => item.itemType === "combo" && item.comboId
      );
      if (comboItems.length > 0) {
        // Group by comboId
        const comboGroups = new Map<string, typeof comboItems>();
        for (const item of comboItems) {
          const group = comboGroups.get(item.comboId!) || [];
          group.push(item);
          comboGroups.set(item.comboId!, group);
        }

        // Validate each combo group
        for (const [comboId, items] of comboGroups) {
          const comboDoc = await adminFirestore
            .collection("combo_products")
            .doc(comboId)
            .get();

          if (!comboDoc.exists) {
            console.warn(`⚠️ Combo ${comboId} not found, skipping validation`);
            continue;
          }

          const comboData = comboDoc.data();
          if (!comboData) continue;

          // Calculate expected discount per item (comboPrice / totalSlots)
          const comboPrice = comboData.comboPrice || 0;
          const originalPrice = comboData.originalPrice || 0;
          const expectedTotalDiscount = originalPrice - comboPrice;

          // Calculate claimed discount from frontend
          const claimedTotalDiscount = items.reduce(
            (acc, item) => acc + (item.discount || 0),
            0
          );

          // Allow small tolerance for rounding
          if (Math.abs(claimedTotalDiscount - expectedTotalDiscount) > 2) {
            console.error(
              `🚨 Combo discount mismatch! Combo: ${comboId}, Expected: ${expectedTotalDiscount}, Claimed: ${claimedTotalDiscount}`
            );
            throw new Error(
              `Invalid combo discount detected. Please refresh and try again.`
            );
          }
        }
      }

      // Calculate shipping
      // --- DYNAMIC SHIPPING CALCULATION ---
      const totalItems = order.items.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      // 1. Calculate Total Weight
      let totalWeight = 0;
      for (const item of order.items) {
        const prod = productMap.get(item.itemId);
        // Default to 1kg if weight is missing to prevent under-pricing shipping
        const weight = prod?.weight || 1;
        totalWeight += weight * item.quantity;
      }

      // 2. Fetch Active Shipping Rules
      let serverShippingFee = 0;
      const rulesSnapshot = await adminFirestore
        .collection("shipping_rules")
        .where("isActive", "==", true)
        .get();

      if (!rulesSnapshot.empty) {
        const rules = rulesSnapshot.docs.map(
          (doc) => doc.data() as ShippingRule
        );
        // Find matching rule
        const match = rules.find(
          (r) => totalWeight >= r.minWeight && totalWeight < r.maxWeight
        );

        if (match) {
          if (
            match.isIncremental &&
            match.baseWeight !== undefined &&
            match.perKgRate !== undefined
          ) {
            const extraWeight = Math.max(0, totalWeight - match.baseWeight);
            const extraCost = Math.ceil(extraWeight) * match.perKgRate;
            serverShippingFee = match.rate + extraCost;
          } else {
            serverShippingFee = match.rate;
          }
        } else {
          // Check if weight exceeds all rules, use the max weight rule or fallback
          // Sort by maxWeight descending
          rules.sort((a, b) => b.maxWeight - a.maxWeight);
          if (totalWeight >= rules[0].maxWeight) {
            const maxRule = rules[0];
            if (
              maxRule.isIncremental &&
              maxRule.baseWeight !== undefined &&
              maxRule.perKgRate !== undefined
            ) {
              const extraWeight = Math.max(0, totalWeight - maxRule.baseWeight);
              const extraCost = Math.ceil(extraWeight) * maxRule.perKgRate;
              serverShippingFee = maxRule.rate + extraCost;
            } else {
              serverShippingFee = maxRule.rate;
            }
          } else {
            // Fallback if no range matches (unlikely if covered from 0)
            serverShippingFee =
              totalItems <= 1 ? SHIPPING_FLAT_RATE_1 : SHIPPING_FLAT_RATE_2;
          }
        }
      } else {
        // Fallback to Legacy Logic if no rules exist
        serverShippingFee =
          totalItems === 0
            ? 0
            : totalItems === 1
            ? SHIPPING_FLAT_RATE_1
            : SHIPPING_FLAT_RATE_2;
      }

      // Calculate payment fee (percentage of subtotal)
      const subtotalBeforeFees = itemsTotal - itemDiscounts;
      const paymentFeePercent = order.fee
        ? (order.fee / subtotalBeforeFees) * 100
        : 0;
      const serverPaymentFee = parseFloat(
        ((subtotalBeforeFees * paymentFeePercent) / 100).toFixed(2)
      );

      // Calculate server total
      const serverSubtotal =
        itemsTotal - itemDiscounts + serverShippingFee + serverPaymentFee;
      const serverCouponDiscount = finalDiscount;
      const serverTotal =
        serverSubtotal - serverCouponDiscount - promotionDiscount;

      // Compare with frontend total
      const frontendTotal = order.total || 0;
      const difference = Math.abs(serverTotal - frontendTotal);

      if (difference > TOLERANCE) {
        console.error(
          `🚨 Total mismatch! Server: ${serverTotal}, Frontend: ${frontendTotal}, Diff: ${difference}`
        );
        console.error(
          `Breakdown: items=${itemsTotal}, itemDiscounts=${itemDiscounts}, shipping=${serverShippingFee}, fee=${serverPaymentFee}, coupon=${serverCouponDiscount}, promotion=${promotionDiscount}`
        );
        throw new Error(
          `Order total mismatch. Expected Rs. ${serverTotal.toFixed(
            2
          )}, received Rs. ${frontendTotal.toFixed(
            2
          )}. Please refresh and try again.`
        );
      }

      // Use server-calculated total for validation only
      // If validation passes, keep frontend values
    }

    // Validate that frontend discount values match server validation
    // Only log warnings for mismatches, don't override (trust frontend if coupon/promo was validated)
    const frontendCouponDiscount = order.couponDiscount || 0;
    const frontendPromotionDiscount = order.promotionDiscount || 0;

    if (Math.abs(frontendCouponDiscount - finalDiscount) > 1) {
      console.warn(
        `⚠️ Coupon discount mismatch: frontend=${frontendCouponDiscount}, server=${finalDiscount}`
      );
    }

    if (Math.abs(frontendPromotionDiscount - promotionDiscount) > 1) {
      console.warn(
        `⚠️ Promotion discount mismatch: frontend=${frontendPromotionDiscount}, server=${promotionDiscount}`
      );
    }

    // Store only tracking IDs from server validation, keep discount values from frontend
    orderData.appliedCouponId = appliedCouponId;
    orderData.appliedPromotionId = appliedPromotionId;
    orderData.appliedPromotionIds = appliedPromotionIds;

    // --- STORE ORDER (Batch, with retry) ---
    if (fromSource === "store") {
      // ... existing store logic ...
      if (!order.stockId) throw new Error("Stock ID is required");
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const batch = adminFirestore.batch();

          await Promise.all(
            order.items.map(async (item) => {
              const invSnap = await adminFirestore
                .collection("stock_inventory")
                .where("productId", "==", item.itemId)
                .where("variantId", "==", item.variantId)
                .where("size", "==", item.size)
                .where("stockId", "==", order.stockId)
                .limit(1)
                .get();

              if (invSnap.empty)
                throw new Error(`Missing inventory for ${item.name}`);

              const invDoc = invSnap.docs[0];
              const invData = invDoc.data() as InventoryItem;
              const prodData = productMap.get(item.itemId);
              if (!prodData)
                throw new Error(`Product not found: ${item.itemId}`);

              const newInvQty = Math.max(
                (invData.quantity ?? 0) - item.quantity,
                0
              );
              const newTotalStock = Math.max(
                (prodData.totalStock ?? 0) - item.quantity,
                0
              );

              batch.update(invDoc.ref, { quantity: newInvQty });
              batch.update(
                adminFirestore.collection("products").doc(item.itemId),
                {
                  totalStock: newTotalStock,
                  inStock: newTotalStock > 0,
                  updatedAt: now,
                }
              );
            })
          );

          batch.set(orderRef, orderData);
          await batch.commit();

          console.log(
            `🏬 Store order ${order.orderId} committed (attempt ${attempt})`
          );
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          console.warn(`⚠️ Store order retry #${attempt}: ${err.message}`);
          await new Promise((r) => setTimeout(r, attempt * 200));
        }
      }
    }

    // --- WEBSITE ORDER (Strict Transaction) ---
    else if (fromSource === "website") {
      let success = false;
      const settingsSnap = await adminFirestore
        .collection("app_settings")
        .doc("erp_settings")
        .get();

      const stockId = settingsSnap.data()?.onlineStockId;
      if (!settingsSnap.exists || !settingsSnap.data()?.onlineStockId)
        throw new Error("ERP settings or onlineStockId missing");
      orderData.stockId = stockId;
      for (let attempt = 1; attempt <= 3 && !success; attempt++) {
        try {
          await adminFirestore.runTransaction(async (tx) => {
            for (const item of order.items) {
              const invQuery = adminFirestore
                .collection("stock_inventory")
                .where("productId", "==", item.itemId)
                .where("variantId", "==", item.variantId)
                .where("size", "==", item.size)
                .where("stockId", "==", stockId)
                .limit(1);

              const invSnap = await tx.get(invQuery);
              if (invSnap.empty)
                throw new Error(`Inventory not found for ${item.name}`);

              const invDoc = invSnap.docs[0];
              const invData = invDoc.data() as InventoryItem;
              const prodData = productMap.get(item.itemId);
              if (!prodData)
                throw new Error(`Product not found: ${item.itemId}`);

              const newInvQty = (invData.quantity ?? 0) - item.quantity;
              const newTotalStock = (prodData.totalStock ?? 0) - item.quantity;

              if (newInvQty < 0 || newTotalStock < 0)
                throw new Error(`Insufficient stock for ${item.name}`);

              tx.update(invDoc.ref, { quantity: newInvQty });
              tx.update(
                adminFirestore.collection("products").doc(item.itemId),
                {
                  totalStock: newTotalStock,
                  inStock: newTotalStock > 0,
                  updatedAt: now,
                }
              );
            }

            tx.set(orderRef, {
              ...orderData,
              stockId,
              customer: {
                ...order.customer,
                updatedAt: now,
                createdAt: now,
              },
            });
          });

          console.log(
            `🌐 Website order ${order.orderId} committed (attempt ${attempt})`
          );

          // Track Coupon Usage AFTER successful commit
          if (appliedCouponId) {
            await trackCouponUsage(
              appliedCouponId,
              order.customer?.uid || "guest",
              order.orderId,
              finalDiscount
            );
          }

          success = true;
        } catch (err) {
          if (attempt === 3) throw err;
          console.warn(`⚠️ Transaction retry #${attempt}: ${err.message}`);
          await new Promise((r) => setTimeout(r, attempt * 200));
        }
      }
    }

    await Promise.allSettled([clearPosCart()]);
    // Hash update...
    const orderForHashSnap = await orderRef.get();
    const orderForHash = orderForHashSnap.data();
    if (orderForHash) await updateOrAddOrderHash(orderForHash);
  } catch (error) {
    console.error("❌ addOrder failed:", error);
    throw error;
  }
};

const clearPosCart = async () => {
  try {
    const snap = await adminFirestore.collection("posCart").get();
    if (snap.empty) return;
    const batch = adminFirestore.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log("POS cart cleared");
  } catch (error) {
    console.error("clearPosCart failed:", error);
    throw error;
  }
};

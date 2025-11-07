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

const ORDERS_COLLECTION = "orders";

/**
 * Helper to safely convert Firestore Timestamps or strings to a locale string.
 * Prevents crashes if the field is null, undefined, or not a date.
 */
function toSafeLocaleString(val: any): string | null {
  if (!val) {
    return null;
  }
  // Check if it's a Firestore Timestamp
  if (typeof (val as Timestamp)?.toDate === "function") {
    return (val as Timestamp).toDate().toLocaleString();
  }
  // Check if it's a string or number that can be parsed
  try {
    const date = new Date(val);
    // Check if the date is valid before converting
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return String(val); // Return original value if not a valid date
  } catch (e) {
    return String(val); // Fallback
  }
}

export const getOrders = async (
  pageNumber: number = 1,
  size: number = 20,
  from?: string,
  to?: string,
  status?: string,
  paymentStatus?: string
) => {
  try {
    const offset = (pageNumber - 1) * size;
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
    if (paymentStatus) {
      query = query.where("paymentStatus", "==", paymentStatus);
    }
    const ordersSnapshot = await query.limit(size).offset(offset).get();

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
    console.log(`Fetched ${orders.length} orders on page ${pageNumber}`);
    return orders;
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
    } as Order;
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

export const addOrder = async (order: Partial<Order>) => {
  if (!order.orderId) throw new Error("Order ID is required");
  if (!order.items?.length) throw new Error("Order items are required");
  if (!order.from) throw new Error("Order 'from' field is required");

  const fromSource = order.from.toLowerCase();
  if (!["store", "website"].includes(fromSource))
    throw new Error(`Invalid order source: ${order.from}`);

  const orderRef = adminFirestore.collection("orders").doc(order.orderId);
  const now = admin.firestore.Timestamp.now();
  const orderData: Order = { ...order, createdAt: now, updatedAt: now };

  try {
    const productRefs = order.items.map((i) =>
      adminFirestore.collection("products").doc(i.itemId)
    );
    const productSnaps = await adminFirestore.getAll(...productRefs);
    const productMap = new Map(
      productSnaps.map((snap) => [snap.id, snap.data() as Product])
    );

    // --- STORE ORDER (Batch, with retry) ---
    if (fromSource === "store") {
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
      order.stockId = stockId;
      for (let attempt = 1; attempt <= 3 && !success; attempt++) {
        try {
          await adminFirestore.runTransaction(async (tx) => {
            for (const item of order.items) {
              const invQuery = adminFirestore
                .collection("stock_inventory")
                .where("productId", "==", item.itemId)
                .where("variantId", "==", item.variantId)
                .where("size", "==", item.size)
                .where("stockId", "==", order.stockId)
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
          success = true;
        } catch (err) {
          if (attempt === 3) throw err;
          console.warn(`⚠️ Transaction retry #${attempt}: ${err.message}`);
          await new Promise((r) => setTimeout(r, attempt * 200));
        }
      }
    }

    await Promise.allSettled([clearPosCart()]);

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

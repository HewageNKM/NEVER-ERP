import { adminFirestore } from "@/firebase/firebaseAdmin";
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
  try {
    if (!order.orderId) throw new Error("Order ID is required");
    if (!order.items || order.items.length === 0)
      throw new Error("Order items are required");

    const orderRef = adminFirestore.collection("orders").doc(order.orderId);

    const orderData: Order = {
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // --- Run transaction ---
    await adminFirestore.runTransaction(async (transaction) => {
      // --- STORE ORDER ---
      if (order.from?.toLowerCase() === "store") {
        if (!order.stockId)
          throw new Error("Stock ID is required for store orders");

        for (const item of order.items!) {
          // ✅ Fix: Firestore query uses chained .where() correctly
          const inventoryQuery = adminFirestore
            .collection("stock_inventory")
            .where("productId", "==", item.itemId)
            .where("variantId", "==", item.variantId)
            .where("size", "==", item.size)
            .where("stockId", "==", order.stockId);

          const querySnap = await transaction.get(inventoryQuery);

          if (querySnap.empty) {
            console.warn(
              `⚠️ Inventory not found for ${item.name} (${item.size}) in stock ${order.stockId}`
            );
            continue;
          }

          const invDoc = querySnap.docs[0];
          const invData = invDoc.data() as InventoryItem;
          const newQty = (invData.quantity ?? 0) - item.quantity;

          // Allow negative quantity for store, but warn
          if (newQty < 0) {
            console.warn(
              `⚠️ Store order exceeds stock for ${item.name}. Available: ${invData.quantity}, Ordered: ${item.quantity}`
            );
          }

          transaction.update(invDoc.ref, { quantity: newQty });
          console.log(
            `🛒 Store order → updated stock for ${item.name}: ${newQty}`
          );
        }
      }

      // --- WEBSITE ORDER ---
      else if (order.from?.toLowerCase() === "website") {
        if (!order.stockId)
          throw new Error("Stock ID is required for website orders");

        for (const item of order.items!) {
          //1️⃣ Also reduce stock from respective stock_inventory
          const inventoryQuery = adminFirestore
            .collection("stock_inventory")
            .where("productId", "==", item.itemId)
            .where("variantId", "==", item.variantId)
            .where("size", "==", item.size)
            .where("stockId", "==", order.stockId);

          const invSnap = await transaction.get(inventoryQuery);

          if (invSnap.empty) {
            console.warn(
              `⚠️ No stock_inventory found for ${item.name} (${item.size}) under stockId: ${order.stockId}`
            );
            continue;
          }

          const invDoc = invSnap.docs[0];
          const invData = invDoc.data() as InventoryItem;

          if (invData.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock in stock_inventory for ${item.name}. Available: ${invData.quantity}, Requested: ${item.quantity}`
            );
          }

          const newStockQty = invData.quantity - item.quantity;

          transaction.update(invDoc.ref, { quantity: newStockQty });
          //4️⃣Fetch the product document
          const productRef = adminFirestore
            .collection("products")
            .doc(item.itemId);
          const prodSnap = await transaction.get(productRef);

          if (!prodSnap.exists) {
            throw new Error(`Product ${item.itemId} not found`);
          }

          const productData = prodSnap.data() as Product;
          const availableStock = productData.totalStock ?? 0;

          // 2️⃣ Validate global stock
          if (availableStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.name}. Available: ${availableStock}, Requested: ${item.quantity}`
            );
          }

          const newTotalStock = availableStock - item.quantity;

          // 3️⃣ Update product total stock
          transaction.update(productRef, {
            totalStock: newTotalStock,
            inStock: newTotalStock > 0,
            updatedAt: new Date(),
          });

          console.log(
            `🌐 Website order → updated global product stock for ${item.name}: ${newTotalStock}`
          );
          console.log(
            `🏬 Website order → reduced stock_inventory for ${item.name}: ${newStockQty}`
          );
        }
      } else {
        throw new Error(`Unknown order source: ${order.from}`);
      }

      // ✅ Save order AFTER successful stock updates
      transaction.set(orderRef, orderData);
    });
    const orderDoc = await orderRef.get();
    const data = orderDoc.data();
    if (!data) console.warn(`Order with ID ${data?.orderId} not found`);
    await updateOrAddOrderHash(data);
    await clearPosCart();
    console.log(
      `✅ Order ${order.orderId} successfully added from ${order.from}`
    );
  } catch (error) {
    console.error("❌ Error adding order:", error);
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

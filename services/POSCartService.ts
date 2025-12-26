// ================================
// 🔹 POS CART OPERATIONS
// ================================

import { adminFirestore } from "@/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export interface POSCartItem {
  itemId: string;
  variantId: string;
  name: string;
  variantName: string;
  thumbnail: string;
  size: string;
  discount: number;
  type: string;
  quantity: number;
  price: number;
  bPrice: number;
  stockId: string;
  createdAt?: FirebaseFirestore.Timestamp;
}

export interface InventoryItem {
  productId: string;
  variantId: string;
  size: string;
  stockId: string;
  quantity: number;
}

// ================================
// ✅ Get all items in POS cart
// ================================
export const getPosCart = async (): Promise<POSCartItem[]> => {
  const snap = await adminFirestore.collection("posCart").get();
  return snap.docs.map((d) => d.data() as POSCartItem);
};

// ================================
// ✅ Add item to POS cart using InventoryItem info
// ================================
export const addItemToPosCart = async (item: POSCartItem) => {
  const posCart = adminFirestore.collection("posCart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Fetch inventory item using productId, variantId, size, stockId
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty) throw new Error("Item not found in inventory");

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 2️⃣ Check if requested quantity is bigger than available
    if (item.quantity > inventoryData.quantity) {
      console.warn(
        `Warning: Requested quantity (${item.quantity}) is greater than available stock (${inventoryData.quantity}) for productId: ${item.itemId}, size: ${item.size}, stockId: ${item.stockId}`
      );
    }

    // 3️⃣ Deduct stock (allow negative)
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity - item.quantity,
    });

    // 4️⃣ Add to POS cart
    tx.set(posCart.doc(), { ...item, createdAt: FieldValue.serverTimestamp() });
  });
};

// ================================
// ✅ Remove item from POS cart and restock
// ================================
export const removeFromPosCart = async (item: POSCartItem) => {
  const posCart = adminFirestore.collection("posCart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Fetch inventory item
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty) throw new Error("Item not found in inventory");

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 2️⃣ Restore stock
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity + item.quantity,
    });

    // 3️⃣ Delete item from POS cart
    const cartQuery = await posCart
      .where("itemId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (!cartQuery.empty) {
      tx.delete(cartQuery.docs[0].ref);
    }
  });
};

// ================================
// ✅ Clear entire POS cart
// ================================
export const clearPosCart = async () => {
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

// ================================
// ✅ Update cart item quantity
// ================================
export const updatePosCartItemQuantity = async (
  item: POSCartItem,
  newQuantity: number
) => {
  const posCart = adminFirestore.collection("posCart");

  await adminFirestore.runTransaction(async (tx) => {
    // 1️⃣ Find the cart item
    const cartQuery = await posCart
      .where("itemId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (cartQuery.empty) throw new Error("Cart item not found");

    const cartDoc = cartQuery.docs[0];
    const currentItem = cartDoc.data() as POSCartItem;
    const quantityDiff = newQuantity - currentItem.quantity;

    // 2️⃣ Fetch inventory item
    const inventoryQuery = await adminFirestore
      .collection("stock_inventory")
      .where("productId", "==", item.itemId)
      .where("variantId", "==", item.variantId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (inventoryQuery.empty) throw new Error("Item not found in inventory");

    const inventoryRef = inventoryQuery.docs[0].ref;
    const inventoryData = inventoryQuery.docs[0].data() as InventoryItem;

    // 3️⃣ Update inventory (deduct if increasing, restore if decreasing)
    tx.update(inventoryRef, {
      quantity: inventoryData.quantity - quantityDiff,
    });

    // 4️⃣ Update cart item quantity
    tx.update(cartDoc.ref, { quantity: newQuantity });
  });
};

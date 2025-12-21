import { adminFirestore } from "@/firebase/firebaseAdmin";
import {
  InventoryAdjustment,
  AdjustmentItem,
  AdjustmentType,
} from "@/model/InventoryAdjustment";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "inventory_adjustments";
const INVENTORY_COLLECTION = "stock_inventory";

/**
 * Generate adjustment number
 */
const generateAdjustmentNumber = async (): Promise<string> => {
  const today = new Date();
  const prefix = `ADJ-${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const snapshot = await adminFirestore
    .collection(COLLECTION)
    .where("adjustmentNumber", ">=", prefix)
    .where("adjustmentNumber", "<", prefix + "\uf8ff")
    .limit(1)
    .get();

  let sequence = 1;
  if (!snapshot.empty) {
    const last = snapshot.docs[0].data().adjustmentNumber;
    const lastSeq = parseInt(last.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

/**
 * Get all adjustments
 */
export const getAdjustments = async (
  type?: AdjustmentType
): Promise<InventoryAdjustment[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTION);

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryAdjustment[];
  } catch (error) {
    console.error("[AdjustmentService] Error fetching adjustments:", error);
    throw error;
  }
};

/**
 * Get adjustment by ID
 */
export const getAdjustmentById = async (
  id: string
): Promise<InventoryAdjustment | null> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as InventoryAdjustment;
  } catch (error) {
    console.error("[AdjustmentService] Error fetching adjustment:", error);
    throw error;
  }
};

/**
 * Create adjustment and update inventory
 */
export const createAdjustment = async (
  adjustment: Omit<
    InventoryAdjustment,
    "id" | "adjustmentNumber" | "createdAt" | "updatedAt"
  >
): Promise<InventoryAdjustment> => {
  try {
    const adjustmentNumber = await generateAdjustmentNumber();

    // Create adjustment record
    const docRef = await adminFirestore.collection(COLLECTION).add({
      ...adjustment,
      adjustmentNumber,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update inventory based on adjustment type
    await updateInventoryFromAdjustment(adjustment.items, adjustment.type);

    console.log(
      `[AdjustmentService] Created adjustment ${adjustmentNumber} with ${adjustment.items.length} items`
    );

    return {
      id: docRef.id,
      ...adjustment,
      adjustmentNumber,
    };
  } catch (error) {
    console.error("[AdjustmentService] Error creating adjustment:", error);
    throw error;
  }
};

/**
 * Update inventory based on adjustment
 */
const updateInventoryFromAdjustment = async (
  items: AdjustmentItem[],
  type: AdjustmentType
): Promise<void> => {
  const batch = adminFirestore.batch();

  for (const item of items) {
    if (item.quantity <= 0) continue;

    // Get current inventory
    const inventoryQuery = await adminFirestore
      .collection(INVENTORY_COLLECTION)
      .where("productId", "==", item.productId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    let currentQty = 0;
    let inventoryRef: FirebaseFirestore.DocumentReference;

    if (!inventoryQuery.empty) {
      inventoryRef = inventoryQuery.docs[0].ref;
      currentQty = inventoryQuery.docs[0].data().quantity || 0;
    } else {
      inventoryRef = adminFirestore.collection(INVENTORY_COLLECTION).doc();
    }

    // Calculate new quantity based on type
    let newQty = currentQty;
    switch (type) {
      case "add":
      case "return":
        newQty = currentQty + item.quantity;
        break;
      case "remove":
      case "damage":
        newQty = Math.max(0, currentQty - item.quantity);
        break;
      case "transfer":
        newQty = Math.max(0, currentQty - item.quantity);
        // Also add to destination
        if (item.destinationStockId) {
          await addToDestinationStock(item);
        }
        break;
    }

    if (!inventoryQuery.empty) {
      batch.update(inventoryRef, {
        quantity: newQty,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      batch.set(inventoryRef, {
        productId: item.productId,
        variantId: item.variantId || null,
        size: item.size,
        stockId: item.stockId,
        quantity: newQty,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
};

/**
 * Add stock to destination for transfers
 */
const addToDestinationStock = async (item: AdjustmentItem): Promise<void> => {
  if (!item.destinationStockId) return;

  const inventoryQuery = await adminFirestore
    .collection(INVENTORY_COLLECTION)
    .where("productId", "==", item.productId)
    .where("size", "==", item.size)
    .where("stockId", "==", item.destinationStockId)
    .limit(1)
    .get();

  if (!inventoryQuery.empty) {
    const doc = inventoryQuery.docs[0];
    const currentQty = doc.data().quantity || 0;
    await doc.ref.update({
      quantity: currentQty + item.quantity,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await adminFirestore.collection(INVENTORY_COLLECTION).add({
      productId: item.productId,
      variantId: item.variantId || null,
      size: item.size,
      stockId: item.destinationStockId,
      quantity: item.quantity,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
};

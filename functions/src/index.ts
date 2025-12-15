import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as crypto from "crypto";
import * as stringify from "json-stable-stringify";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();
const HASH_SECRET = defineSecret("HASH_SECRET");

// ==========================
// 🔧 Constants & Enums
// ==========================
const BATCH_LIMIT = 450;

enum PaymentStatus {
  Pending = "Pending",
  Paid = "Paid",
  Failed = "Failed",
  Refunded = "Refunded",
}

// ==========================
// 🧩 Utility Functions
// ==========================
const commitBatch = async (
  batch: FirebaseFirestore.WriteBatch,
  opCount: number
): Promise<[FirebaseFirestore.WriteBatch, number]> => {
  if (opCount >= BATCH_LIMIT) {
    await batch.commit();
    console.log(`💾 Committed batch of ${opCount} operations`);
    return [db.batch(), 0];
  }
  return [batch, opCount];
};

const generateDocumentHash = (docData: any) => {
  const canonical = stringify(docData);
  const hashingString = `${canonical}${HASH_SECRET}`;
  return crypto.createHash("sha256").update(hashingString).digest("hex");
};

// ==========================
// 🕒 Scheduled Cleanup
// ==========================
export const SheduleOrdersCleanup = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "Asia/Colombo",
    region: "asia-south1",
    memory: "512MiB",
    timeoutSeconds: 540,
    secrets: ["HASH_SECRET"],
  },
  async () => {
    try {
      console.log("🧹 Starting new restock cleanup job...");

      const ordersRef = db.collection("orders");
      const hashLedgerRef = db.collection("hash_ledger");
      const logsRef = db.collection("cleanup_logs");

      const cutoff = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 4 * 60 * 60 * 1000)
      );

      const snapshot = await ordersRef
        .where("createdAt", "<=", cutoff)
        .where("paymentStatus", "in", [
          PaymentStatus.Failed,
          PaymentStatus.Refunded,
        ])
        .get();

      if (snapshot.empty) {
        console.log("✅ No failed/refunded orders to restock.");
        return;
      }

      const targets = snapshot.docs.filter((d) => !d.data()?.restocked);
      if (!targets.length) {
        console.log("✅ All failed/refunded orders already processed.");
        return;
      }

      console.log(`⚙️ Processing ${targets.length} orders for restock.`);

      let batch = db.batch();
      let opCount = 0;
      const logs: any[] = [];

      for (const orderDoc of targets) {
        const order = orderDoc.data();
        const orderId = orderDoc.id;

        const stockId = order.stockId;
        if (!stockId) {
          console.warn(`❗ Missing stockId for order ${orderId}`);
          continue;
        }

        for (const item of order.items ?? []) {
          // Identify if this is a combo item
          const isComboItem = item.isComboItem === true;
          const comboName = item.comboName || null;
          const comboId = item.comboId || null;

          if (isComboItem) {
            console.log(
              `📦 Restocking combo item: ${item.name} from combo "${comboName}" (${comboId})`
            );
          }

          // 1️⃣ Restock stock_inventory
          const invQuery = db
            .collection("stock_inventory")
            .where("productId", "==", item.itemId)
            .where("variantId", "==", item.variantId)
            .where("size", "==", item.size)
            .where("stockId", "==", stockId);

          const invSnap = await invQuery.get();
          if (invSnap.empty) {
            console.warn(
              `⚠️ No stock_inventory found for ${item.name} (${
                item.size
              }) in stock ${stockId}${
                isComboItem ? ` [COMBO: ${comboName}]` : ""
              }`
            );
            continue;
          }

          const invDoc = invSnap.docs[0];
          const invData = invDoc.data();
          const newQty = (invData.quantity ?? 0) + item.quantity;

          batch.update(invDoc.ref, {
            quantity: newQty,
            updatedAt: new Date(),
          });
          opCount++;

          console.log(
            `✅ Restocked ${item.quantity}x ${item.name} (${
              item.size
            }) → new qty: ${newQty}${isComboItem ? ` [COMBO]` : ""}`
          );

          // 2️⃣ Restock product totalStock
          const productRef = db.collection("products").doc(item.itemId);
          const productSnap = await productRef.get();
          if (productSnap.exists) {
            const productData = productSnap.data()!;
            const totalStock = (productData.totalStock ?? 0) + item.quantity;

            batch.update(productRef, {
              totalStock,
              inStock: totalStock > 0,
              updatedAt: new Date(),
            });
            opCount++;
          }

          [batch, opCount] = await commitBatch(batch, opCount);
        }

        // 3️⃣ Update or delete order + hash ledger
        const hashDocRef = hashLedgerRef.doc(`hash_${orderId}`);

        if (order.paymentStatus === PaymentStatus.Failed) {
          batch.delete(orderDoc.ref);
          batch.delete(hashDocRef);
        } else if (order.paymentStatus === PaymentStatus.Refunded) {
          batch.update(orderDoc.ref, {
            restocked: true,
            restockedAt: admin.firestore.Timestamp.now(),
            cleanupProcessed: true,
          });

          const newHash = generateDocumentHash(order);
          batch.set(
            hashDocRef,
            {
              id: hashDocRef.id,
              sourceCollection: "orders",
              sourceDocId: orderId,
              hashValue: newHash,
              updatedAt: admin.firestore.Timestamp.now(),
              cleanupFlag: true,
            },
            { merge: true }
          );
        }

        [batch, opCount] = await commitBatch(batch, opCount);

        // 4️⃣ Log cleanup with combo info
        const comboItems = (order.items ?? []).filter(
          (i: any) => i.isComboItem === true
        );
        const comboIds = [...new Set(comboItems.map((i: any) => i.comboId))];

        logs.push({
          context: "order_cleanup",
          refId: orderId,
          userId: order.userId ?? null,
          reason:
            order.paymentStatus === PaymentStatus.Refunded
              ? "Refunded order restocked"
              : "Failed payment over 4 hours",
          paymentStatus: order.paymentStatus,
          stockId,
          items: order.items ?? [],
          hasComboItems: comboItems.length > 0,
          comboIds: comboIds.length > 0 ? comboIds : null,
          comboItemCount: comboItems.length,
          timestamp: admin.firestore.Timestamp.now(),
        });
      }

      if (opCount > 0) {
        await batch.commit();
        console.log(`💾 Final batch committed (${opCount} ops).`);
      }

      // 5️⃣ Write logs
      if (logs.length) {
        const logBatch = db.batch();
        for (const log of logs) {
          logBatch.set(logsRef.doc(), log);
        }
        await logBatch.commit();
        console.log(`🧾 Logged ${logs.length} cleanup entries.`);
      }

      console.log("✅ Restock cleanup completed successfully.");
    } catch (err) {
      console.error("❌ Error during restock cleanup:", err);
    }
  }
);

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    // Fallback or development
    initializeApp();
  }
}

const db = getFirestore();

async function migratePaymentMethods() {
  console.log("Starting migration of payment methods...");

  const oldCollectionRef = db.collection("paymentMethods");
  const newCollectionRef = db.collection("payment_methods");

  const snapshot = await oldCollectionRef.get();

  if (snapshot.empty) {
    console.log("No payment methods found in 'paymentMethods'.");
    return;
  }

  let count = 0;
  const batchRequests: Promise<any>[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // transform data
    const newData = {
      ...data,
      id: doc.id, // Ensure ID is in the doc data if needed, or just rely on doc ID
      status: true, // Force status to true as requested
      available: Array.isArray(data.available) ? data.available : ["Store"], // Ensure array
      isDeleted: data.isDeleted === true, // Default false/ensure boolean
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(), // Update timestamp to show migration time
    };

    // Sanitize: remove any unwanted fields if necessary, or just keep all
    // If 'status' was a string "active", it is now boolean true.

    console.log(
      `Migrating: ${data.name || doc.id} -> payment_methods/${doc.id}`
    );

    // We can use a batch, but for simplicity/robustness with potentially large sets (unlikely for payment methods),
    // we'll just do individual sets or use a batch of 500 if needed. Payment methods are usually few.
    // Using individual promises for simplicity here as volume is expected to be low (<100).

    batchRequests.push(newCollectionRef.doc(doc.id).set(newData));
    count++;
  }

  await Promise.all(batchRequests);

  console.log(`Successfully migrated ${count} payment methods.`);
}

migratePaymentMethods()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  });

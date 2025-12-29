import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET =
    "gs://dummy-bucket.appspot.com";
}

(async () => {
  try {
    // Dynamic import to ensure env vars are set before firebase-admin inits
    const { adminAuth, adminFirestore } = await import(
      "@/firebase/firebaseAdmin"
    );

    const userIds = [
      "pMUBLz5M2GeYhlQ6OpWY9hTzaMD2",
      "LTEyfDS7NvWWEzVUK6IaitIHrM33",
    ];

    console.log("Starting migration...");

    for (const uid of userIds) {
      try {
        console.log(`Migrating user: ${uid}`);

        // 1. Update Firestore
        const userRef = adminFirestore.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          await userRef.update({
            role: "ADMIN",
            updatedAt: new Date(),
          });
          console.log(`- Firestore updated for ${uid}`);
        } else {
          console.warn(
            `- User ${uid} not found in Firestore, skipping Firestore update.`
          );
        }

        // 2. Update Custom Claims
        await adminAuth.setCustomUserClaims(uid, { role: "ADMIN" });
        console.log(`- Custom Claims updated for ${uid}`);
      } catch (error) {
        console.error(`Failed to migrate user ${uid}:`, error);
      }
    }

    console.log("Migration finished.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();

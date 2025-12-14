import { adminFirestore, deleteFiles } from "@/firebase/firebaseAdmin";
import admin from "firebase-admin";

// ============ PROMOTIONS (ADS) LOGIC ============

export interface Promotion {
  id?: string;
  file: string; // Filename in storage
  url: string; // Public URL
  title: string;
  link: string;
  createdAt?: string;
}

const ADS_COLLECTION = "website_ads";

export const addPromotion = async ({
  file,
  url,
  title,
  link,
}: {
  file: string;
  url: string;
  title: string;
  link: string;
}) => {
  try {
    console.log("Adding new website ad:", file);
    let newId: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      newId = `ad${Math.random().toString(36).substring(2, 6)}`;
      const adRef = adminFirestore.collection(ADS_COLLECTION).doc(newId);

      try {
        await adminFirestore.runTransaction(async (transaction) => {
          const doc = await transaction.get(adRef);
          if (doc.exists) throw new Error("ID conflict");

          transaction.set(adRef, {
            id: newId,
            file,
            url,
            title,
            link,
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          });
        });

        console.log("Website ad added with ID:", newId);
        return newId;
      } catch (error: any) {
        attempts++;
      }
    }
    throw new Error("Failed to generate unique ID for website ad");
  } catch (e) {
    console.error("Error adding website ad:", e);
    throw e;
  }
};

export const getAllPromotions = async () => {
  try {
    console.log("Fetching all website ads");
    const snapshot = await adminFirestore
      .collection(ADS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    const list: Promotion[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        file: data.file,
        url: data.url,
        title: data.title,
        link: data.link,
        createdAt: data.createdAt?.toDate?.()?.toLocaleString(),
      });
    });
    return list;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const deletePromotion = async (id: string) => {
  try {
    console.log(`Deleting website ad: ${id}`);
    return await adminFirestore.runTransaction(async (transaction) => {
      const ref = adminFirestore.collection(ADS_COLLECTION).doc(id);
      const doc = await transaction.get(ref);

      if (!doc.exists) {
        throw new Error("Ad not found");
      }

      const fileName = doc.data()?.file;
      if (fileName) {
        await deleteFiles("promotions/" + fileName);
      }

      transaction.delete(ref);
      return { id, deletedAt: new Date() };
    });
  } catch (e) {
    console.error("Error deleting website ad:", e);
    throw e;
  }
};

// ============ NAVIGATION LOGIC ============

export interface NavigationConfig {
  mainNav: any[];
  footerNav: any[];
}

export const getNavigationConfig = async () => {
  try {
    console.log("Fetching navigation config");
    const doc = await adminFirestore
      .collection("site_config")
      .doc("navigation")
      .get();
    if (!doc.exists) {
      return { mainNav: [], footerNav: [] };
    }
    return doc.data() as NavigationConfig;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const saveNavigationConfig = async (config: NavigationConfig) => {
  try {
    console.log("Saving navigation config");
    await adminFirestore
      .collection("site_config")
      .doc("navigation")
      .set(config, { merge: true });
    return { success: true };
  } catch (e) {
    console.error("Error saving navigation config:", e);
    throw e;
  }
};

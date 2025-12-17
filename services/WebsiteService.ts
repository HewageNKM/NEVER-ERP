import { adminFirestore } from "@/firebase/firebaseAdmin";

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

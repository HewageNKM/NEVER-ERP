import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts any Firestore Timestamp, Date, or ISO string
 * into a Sri Lanka Standard Time (UTC+5:30) readable string.
 *
 * ✅ Firestore still stores UTC
 * ✅ Always shows correct Sri Lanka time in any region (local/hosted)
 * ✅ Handles all input types safely
 */
export const toSafeLocaleString = (val: any) => {
  if (!val) return null;

  try {
    let date: Date;

    // 1️⃣ Handle Firestore Timestamp directly (guaranteed UTC)
    if (val instanceof Timestamp) {
      date = new Date(val.seconds * 1000 + val.nanoseconds / 1e6);
    }
    // 2️⃣ Handle Timestamp-like objects (from Firestore SDK)
    else if (typeof (val as Timestamp)?.toDate === "function") {
      date = (val as Timestamp).toDate();
    }
    // 3️⃣ Handle ISO strings or Date objects
    else {
      const valStr = String(val);

      // If it looks like an ISO string but lacks timezone info, assume UTC
      if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(valStr)
      ) {
        date = new Date(valStr + "Z"); // interpret as UTC
      } else {
        date = new Date(valStr);
      }
    }

    // 4️⃣ Guard invalid values
    if (isNaN(date.getTime())) return String(val);

    // 5️⃣ 🕓 Force display in Sri Lanka time
    return date.toLocaleString("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return String(val);
  }
};

import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts any Firestore Timestamp, Date, or ISO string
 * into a Sri Lanka Standard Time (UTC+5:30) readable string.
 *
 * ✅ Firestore still stores UTC
 * ✅ Only the *displayed value* is converted to Sri Lanka time
 */
export const toSafeLocaleString = (val: any) => {
  if (!val) return null;

  try {
    // 1️⃣ Firestore Timestamp → JS Date
    const date =
      typeof (val as Timestamp)?.toDate === "function"
        ? (val as Timestamp).toDate()
        : new Date(val);

    // 2️⃣ Guard against invalid dates
    if (isNaN(date.getTime())) return String(val);

    // 3️⃣ 🕓 Convert only for display
    return date.toLocaleString("en-LK", {
      timeZone: "Asia/Colombo", // force Sri Lanka time for viewing only
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

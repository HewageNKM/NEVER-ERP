import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts any input (Timestamp, Date, ISO string, etc.)
 * into a readable string in Sri Lanka Standard Time (UTC+5:30).
 *
 * - If the input includes a timezone other than UTC+5:30, it will be converted.
 * - If the input is already Sri Lanka time (UTC+5:30 or Asia/Colombo), no shift occurs.
 */
export const toSafeLocaleString = (val: any) => {
  if (!val) return null;

  try {
    // 1️⃣ Convert Firestore Timestamp → JS Date
    const date =
      typeof (val as Timestamp)?.toDate === "function"
        ? (val as Timestamp).toDate()
        : new Date(val);

    // 2️⃣ Guard invalid inputs
    if (isNaN(date.getTime())) return String(val);

    const valStr = String(val);

    // 3️⃣ Detect timezone info from the input
    const tzMatch = valStr.match(/[+-]\d{2}:?\d{2}|UTC[+-]?\d*|GMT[+-]?\d*/i);

    // 4️⃣ Determine if timezone is already Sri Lanka (+05:30)
    const isSriLankaTZ =
      tzMatch && /(\+05:?30|UTC\+5:?30|GMT\+5:?30)/i.test(tzMatch[0]);

    // 5️⃣ Always convert to Asia/Colombo *unless* already +05:30
    return date.toLocaleString("en-US", {
      timeZone: isSriLankaTZ ? undefined : "Asia/Colombo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return String(val);
  }
};

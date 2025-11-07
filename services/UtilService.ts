import { Timestamp } from "firebase-admin/firestore";

export const toSafeLocaleString = async (val: any) => {
  if (!val) return null;

  try {
    const date =
      typeof (val as Timestamp)?.toDate === "function"
        ? (val as Timestamp).toDate()
        : new Date(val);

    if (isNaN(date.getTime())) return String(val);

    // 🕓 Force Sri Lankan time zone display
    return date.toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Colombo",
      timeZoneName: "short",
    });
  } catch {
    return String(val);
  }
};

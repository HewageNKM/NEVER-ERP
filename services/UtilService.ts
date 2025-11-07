import { Timestamp } from "firebase-admin/firestore";
import { formatInTimeZone } from "date-fns-tz"; 


export const toSafeLocaleString = (val: any) => {
  if (!val) return null;

  try {
    // Convert Firestore Timestamp → JS Date
    const date =
      val instanceof Timestamp
        ? val.toDate()
        : typeof (val as Timestamp)?.toDate === "function"
        ? (val as Timestamp).toDate()
        : new Date(val);

    if (isNaN(date.getTime())) return String(val);

    const timeZone = "Asia/Colombo";
    const format = "dd/MM/yyyy, hh:mm:ss a"; 

    return formatInTimeZone(date, timeZone, format);
  } catch {
    return String(val);
  }
};
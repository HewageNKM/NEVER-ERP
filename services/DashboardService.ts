import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { Order } from "@/model/Order";
import { Item } from "@/model/Item";
import { PopularItem } from "@/model/PopularItem";

/**
 * Dashboard Overview Response
 */
export interface DashboardOverview {
  totalOrders: number;
  totalGrossSales: number; // Gross Sale = total - shippingFee + discount
  totalNetSales: number; // Net Sale = total - shippingFee - transactionFee
  totalDiscount: number;
  totalBuyingCost: number; // COGS (Cost of Goods Sold)
  totalProfit: number; // Gross Profit = Net Sales - COGS
}

/**
 * Yearly Sales Performance Response (for chart)
 */
export interface YearlySalesPerformance {
  website: number[]; // 12 months (0=Jan, 11=Dec)
  store: number[];
  year: number;
}

/**
 * Get daily snapshot for the dashboard (today's data)
 */
export const getDailySnapshot = async (): Promise<DashboardOverview> => {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  return getOverviewByDateRange(startOfDay, endOfDay);
};

/**
 * Get overview data for a specific date range
 */
export const getOverviewByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<DashboardOverview> => {
  try {
    console.log(
      `[DashboardService] Fetching overview from ${startDate} to ${endDate}`
    );

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Fetch orders within date range (exclude Failed and Refunded)
    const ordersQuery = adminFirestore
      .collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .where("paymentStatus", "not-in", ["Failed", "Refunded"]);

    const querySnapshot = await ordersQuery.get();

    // Collect unique product IDs for COGS calculation
    const productIds: Set<string> = new Set();
    querySnapshot.docs.forEach((doc) => {
      const order = doc.data() as Order;
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.itemId) {
            productIds.add(item.itemId);
          }
        });
      }
    });

    // Fetch product data for buying prices
    const productDocs = await Promise.all(
      Array.from(productIds).map((productId) =>
        adminFirestore.collection("products").doc(productId).get()
      )
    );

    const productPriceMap = new Map<string, number>();
    productDocs.forEach((doc) => {
      if (doc.exists) {
        const product = doc.data() as Item;
        productPriceMap.set(doc.id, product.buyingPrice || 0);
      }
    });

    // Calculate totals
    let totalOrders = 0;
    let totalGrossSales = 0;
    let totalNetSales = 0;
    let totalDiscount = 0;
    let totalBuyingCost = 0;
    let totalTransactionFee = 0;
    let totalFee = 0;

    querySnapshot.docs.forEach((doc) => {
      const order = doc.data() as Order;
      totalOrders++;

      const orderTotal = order.total || 0;
      const orderDiscount = order.discount || 0;
      const orderShippingFee = order.shippingFee || 0;
      const orderTransactionFee = order.transactionFeeCharge || 0;
      const orderFee = order.fee || 0;

      // Match ReportService formulas:
      // Net Sale = total - shippingFee - transactionFeeCharge
      const netSale = orderTotal - orderShippingFee - orderFee;
      totalNetSales += netSale;

      // Gross Sale (Sales) = total - shippingFee + discount
      const grossSale =
        orderTotal - orderShippingFee + orderDiscount - orderFee;
      totalGrossSales += grossSale;

      // Accumulate discount
      totalDiscount += orderDiscount;

      // Calculate COGS from items (bPrice * quantity)
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const buyingPrice =
            item.bPrice ?? productPriceMap.get(item.itemId) ?? 0;
          const quantity = item.quantity || 0;
          totalBuyingCost += buyingPrice * quantity;
        });
      }
      totalTransactionFee += orderTransactionFee;
      totalFee += orderFee;
    });

    // Gross Profit = Net Sales - COGS (matches ReportService)
    // Note: Transaction fees and order fees are already subtracted in netSale calculation
    const totalProfit =
      totalNetSales - totalBuyingCost + totalFee - totalTransactionFee;

    console.log(
      `[DashboardService] Fetched ${totalOrders} orders | Gross: ${totalGrossSales} | Net: ${totalNetSales} | COGS: ${totalBuyingCost} | Profit: ${totalProfit}`
    );

    return {
      totalOrders,
      totalGrossSales,
      totalNetSales,
      totalDiscount,
      totalBuyingCost,
      totalProfit,
    };
  } catch (error: any) {
    console.error("[DashboardService] Error:", error);
    throw new Error(error.message);
  }
};

/**
 * Get yearly sales performance for chart (order counts by month and source)
 */
export const getYearlySalesPerformance = async (
  year?: number
): Promise<YearlySalesPerformance> => {
  try {
    const currentYear = year || new Date().getFullYear();
    console.log(
      `[DashboardService] Fetching yearly sales performance for ${currentYear}`
    );

    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const startTimestamp = Timestamp.fromDate(startOfYear);
    const endTimestamp = Timestamp.fromDate(endOfYear);

    const ordersQuery = adminFirestore
      .collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .where("paymentStatus", "in", ["Paid", "Pending"]);

    const querySnapshot = await ordersQuery.get();

    const websiteOrders = new Array(12).fill(0);
    const storeOrders = new Array(12).fill(0);

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Order;
      const createdAt = (data.createdAt as Timestamp)?.toDate?.();
      if (createdAt) {
        const monthIndex = createdAt.getMonth();
        const source = data.from?.toString().toLowerCase() || "store";
        if (source === "website") {
          websiteOrders[monthIndex]++;
        } else {
          storeOrders[monthIndex]++;
        }
      }
    });

    console.log(
      `[DashboardService] Sales performance: Website=${websiteOrders.reduce(
        (a, b) => a + b,
        0
      )}, Store=${storeOrders.reduce((a, b) => a + b, 0)}`
    );

    return {
      website: websiteOrders,
      store: storeOrders,
      year: currentYear,
    };
  } catch (error: any) {
    console.error("[DashboardService] Error:", error);
    throw new Error(error.message);
  }
};

/**
 * Recent Order Response (for dashboard timeline)
 */
export interface RecentOrder {
  orderId: string;
  paymentStatus: string;
  customerName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  createdAt: string;
}

/**
 * Get recent orders for dashboard (latest N orders)
 */
export const getRecentOrders = async (
  limitCount: number = 6
): Promise<RecentOrder[]> => {
  try {
    console.log(`[DashboardService] Fetching ${limitCount} recent orders`);

    const ordersQuery = adminFirestore
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limitCount);

    const querySnapshot = await ordersQuery.get();

    const orders: RecentOrder[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Order;

      // Calculate Gross (items * quantity)
      const grossAmount = Array.isArray(data.items)
        ? data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : 0;

      const discountAmount = data.discount || 0;
      const netAmount = grossAmount - discountAmount;

      // Format date
      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toLocaleString()
          : String(data.createdAt);

      return {
        orderId: data.orderId || doc.id,
        paymentStatus: data.paymentStatus || "Unknown",
        customerName: data.customer?.name || "Guest Customer",
        grossAmount,
        discountAmount,
        netAmount,
        createdAt,
      };
    });

    console.log(`[DashboardService] Fetched ${orders.length} recent orders`);
    return orders;
  } catch (error: any) {
    console.error("[DashboardService] Error:", error);
    throw new Error(error.message);
  }
};

/**
 * Get popular items for a specific month (for dashboard)
 */
export const getPopularItems = async (
  limit: number = 10,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  year: number
): Promise<PopularItem[]> => {
  try {
    // 1. Calculate First Day: Year, Month, 1st day
    const startDay = new Date(year, month, 1);
    startDay.setHours(0, 0, 0, 0);

    // 2. Calculate Last Day: "0th" day of the NEXT month gives the last day of THIS month
    const endDay = new Date(year, month + 1, 0);
    endDay.setHours(23, 59, 59, 999);

    console.log(
      `[DashboardService] Fetching popular items from ${startDay.toString()} to ${endDay.toString()}`
    );

    const startTimestamp = Timestamp.fromDate(startDay);
    const endTimestamp = Timestamp.fromDate(endDay);

    // 3. Query Orders
    const orders = await adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .get();

    console.log(
      `[DashboardService] Fetched ${orders.size} orders for popular items`
    );

    // 4. Aggregate Sales Counts
    const itemsMap = new Map<string, number>();
    orders.forEach((doc) => {
      const order = doc.data() as Order;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const count = itemsMap.get(item.itemId) || 0;
          itemsMap.set(item.itemId, count + item.quantity);
        });
      }
    });

    console.log(`[DashboardService] Found ${itemsMap.size} unique items sold`);

    // 5. Sort IDs by count FIRST, slice top N, THEN fetch product data
    const sortedEntries = Array.from(itemsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // 6. Fetch details only for the top items
    const popularItems: PopularItem[] = [];

    await Promise.all(
      sortedEntries.map(async ([itemId, count]) => {
        try {
          const productDoc = await adminFirestore
            .collection("products")
            .doc(itemId)
            .get();

          if (productDoc.exists) {
            const itemData = productDoc.data() as Item;
            popularItems.push({
              item: {
                ...itemData,
                createdAt: null,
                updatedAt: null,
              },
              soldCount: count,
            });
          }
        } catch (fetchErr) {
          console.error(
            `[DashboardService] Error fetching product ${itemId}:`,
            fetchErr
          );
        }
      })
    );

    console.log(
      `[DashboardService] Returning ${popularItems.length} popular items`
    );

    // 7. Final sort (Promise.all might return out of order)
    return popularItems.sort((a, b) => b.soldCount - a.soldCount);
  } catch (error: any) {
    console.error("[DashboardService] Error:", error);
    throw new Error(error.message);
  }
};

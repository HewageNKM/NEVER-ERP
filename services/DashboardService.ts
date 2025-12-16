import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { Order, Item } from "@/model";

/**
 * Dashboard Overview Response
 */
export interface DashboardOverview {
  totalOrders: number;
  totalGrossSales: number; // Gross Sale = order.total + order.discount - order.fee - order.shippingFee
  totalNetSales: number; // Net Sale = order.total - order.fee - order.shippingFee
  totalDiscount: number;
  totalBuyingCost: number; // COGS (Cost of Goods Sold)
  totalProfit: number; // Net Profit = Net Sales - COGS - TransactionFees
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
    let totalTransactionFeeCharge = 0;
    let totalProfit = 0;

    querySnapshot.docs.forEach((doc) => {
      const order = doc.data() as Order;
      totalOrders++;

      const orderTotal = order.total || 0;
      const orderDiscount = order.discount || 0;
      const orderFee = order.fee || 0;
      const orderShippingFee = order.shippingFee || 0;
      const orderTransactionFee = order.transactionFeeCharge || 0;

      // Gross Sale = order.total + order.discount - order.fee - order.shippingFee
      const grossSale =
        orderTotal + orderDiscount - orderFee - orderShippingFee;
      totalGrossSales += grossSale;

      // Net Sale = order.total - order.fee - order.shippingFee
      const netSale = orderTotal - orderFee - orderShippingFee;

      totalNetSales += netSale;

      // Accumulate discounts
      totalDiscount += orderDiscount;
      totalTransactionFeeCharge += orderTransactionFee;

      // Calculate COGS from items
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const buyingPrice =
            item.bPrice ?? productPriceMap.get(item.itemId) ?? 0;
          totalBuyingCost += buyingPrice * (item.quantity || 1);
        });
      }
      const orderProfit =
        orderTotal - orderShippingFee - orderTransactionFee - totalBuyingCost;
      totalProfit += orderProfit;
    });

    // Net Profit = Net Sales - COGS - TransactionFees
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

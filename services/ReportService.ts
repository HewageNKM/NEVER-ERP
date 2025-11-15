import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { toSafeLocaleString } from "./UtilService";

export const getDailySaleReport = async (from: string, to: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    query = query.orderBy("createdAt", "desc");

    const snap = await query.get();

    const orders = snap.docs.map((d) => ({
      orderId: d.id,
      ...d.data(),
      createdAt: toSafeLocaleString(d.data().createdAt),
      updatedAt: toSafeLocaleString(d.data().updatedAt),
    }));

    const getSales = (o: any) =>
      (o.total || 0) - (o.shippingFee || 0) + (o.discount || 0);

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + getSales(o), 0); // FIXED
    const totalShipping = orders.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const totalTransactionFee = orders.reduce(
      (s, o) => s + (o.transactionFeeCharge || 0),
      0
    );
    const totalItemsSold = orders.reduce(
      (count, o) => count + o.items.reduce((c, i) => c + i.quantity, 0),
      0
    );

    // ---------- DAILY SUMMARY ----------
    const dailyMap: Record<
      string,
      {
        date: string;
        orders: number;
        sales: number;
        shipping: number;
        discount: number;
        transactionFee: number;
        itemsSold: number;
      }
    > = {};

    orders.forEach((o) => {
      const dateKey = o.createdAt.split(" ")[0]; // “YYYY-MM-DD”

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          orders: 0,
          sales: 0,
          shipping: 0,
          discount: 0,
          transactionFee: 0,
          itemsSold: 0,
        };
      }

      dailyMap[dateKey].orders += 1;

      // FIXED: deduct shipping from sales
      dailyMap[dateKey].sales += getSales(o);

      dailyMap[dateKey].shipping += o.shippingFee || 0;
      dailyMap[dateKey].discount += o.discount || 0;
      dailyMap[dateKey].transactionFee += o.transactionFeeCharge || 0;
      dailyMap[dateKey].itemsSold += o.items.reduce(
        (c, i) => c + i.quantity,
        0
      );
    });

    const daily = Object.values(dailyMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      summary: {
        totalOrders,
        totalSales,
        totalShipping,
        totalDiscount,
        totalTransactionFee,
        totalItemsSold,
        daily,
        from,
        to,
      },
    };
  } catch (error) {
    console.log("Sale report error:", error);
    throw error;
  }
};

export const getMonthlySummary = async (from: string, to: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    query = query.orderBy("createdAt", "asc");
    const snap = await query.get();

    const orders = snap.docs.map((d) => ({
      orderId: d.id,
      ...d.data(),
      createdAt: d.data().createdAt.toDate(),
    }));

    // Gross sales = total - shipping + discount
    const getSales = (o: any) =>
      (o.total || 0) - (o.shippingFee || 0) + (o.discount || 0);

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + getSales(o), 0); // FIXED
    const totalShipping = orders.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const totalTransactionFee = orders.reduce(
      (s, o) => s + (o.transactionFeeCharge || 0),
      0
    );
    const totalItemsSold = orders.reduce(
      (count, o) => count + (o.items?.reduce((c, i) => c + i.quantity, 0) || 0),
      0
    );

    // ---------- MONTHLY SUMMARY ----------
    const monthlyMap: Record<
      string,
      {
        month: string;
        orders: number;
        sales: number;
        shipping: number;
        discount: number;
        transactionFee: number;
        itemsSold: number;
      }
    > = {};

    orders.forEach((o) => {
      const date = o.createdAt as Date;
      if (!date || isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          orders: 0,
          sales: 0,
          shipping: 0,
          discount: 0,
          transactionFee: 0,
          itemsSold: 0,
        };
      }

      monthlyMap[monthKey].orders += 1;

      // FIXED: subtract shipping from sales
      monthlyMap[monthKey].sales += getSales(o);

      monthlyMap[monthKey].shipping += o.shippingFee || 0;
      monthlyMap[monthKey].discount += o.discount || 0;
      monthlyMap[monthKey].transactionFee += o.transactionFeeCharge || 0;
      monthlyMap[monthKey].itemsSold +=
        o.items?.reduce((c, i) => c + i.quantity, 0) || 0;
    });

    const monthly = Object.values(monthlyMap).sort(
      (a, b) =>
        new Date(a.month + "-01").getTime() -
        new Date(b.month + "-01").getTime()
    );

    return {
      summary: {
        totalOrders,
        totalSales,
        totalShipping,
        totalDiscount,
        totalTransactionFee,
        totalItemsSold,
        monthly,
        from,
        to,
      },
    };
  } catch (error) {
    console.error("Monthly Summary error:", error);
    throw error;
  }
};

export const getYearlySummary = async (from: string, to: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    query = query.orderBy("createdAt", "asc");
    const snap = await query.get();

    const orders = snap.docs.map((d) => ({
      orderId: d.id,
      ...d.data(),
      createdAt: d.data().createdAt.toDate(),
    }));

    /// Gross sales = total - shipping + discount
    const getSales = (o: any) =>
      (o.total || 0) - (o.shippingFee || 0) + (o.discount || 0);

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + getSales(o), 0); // FIXED
    const totalShipping = orders.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const totalTransactionFee = orders.reduce(
      (s, o) => s + (o.transactionFeeCharge || 0),
      0
    );
    const totalItemsSold = orders.reduce(
      (count, o) => count + (o.items?.reduce((c, i) => c + i.quantity, 0) || 0),
      0
    );

    // ---------- YEARLY SUMMARY ----------
    const yearlyMap: Record<
      string,
      {
        year: string;
        orders: number;
        sales: number;
        shipping: number;
        discount: number;
        transactionFee: number;
        itemsSold: number;
        monthly: {
          month: string;
          orders: number;
          sales: number;
          shipping: number;
          discount: number;
          transactionFee: number;
          itemsSold: number;
        }[];
      }
    > = {};

    orders.forEach((o) => {
      const date = o.createdAt as Date;
      if (!date || isNaN(date.getTime())) return;

      const yearKey = `${date.getFullYear()}`;
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!yearlyMap[yearKey]) {
        yearlyMap[yearKey] = {
          year: yearKey,
          orders: 0,
          sales: 0,
          shipping: 0,
          discount: 0,
          transactionFee: 0,
          itemsSold: 0,
          monthly: [],
        };
      }

      // ---- YEARLY TOTALS (FIXED) ----
      yearlyMap[yearKey].orders += 1;
      yearlyMap[yearKey].sales += getSales(o); // FIXED
      yearlyMap[yearKey].shipping += o.shippingFee || 0;
      yearlyMap[yearKey].discount += o.discount || 0;
      yearlyMap[yearKey].transactionFee += o.transactionFeeCharge || 0;
      yearlyMap[yearKey].itemsSold +=
        o.items?.reduce((c, i) => c + i.quantity, 0) || 0;

      // ---- MONTHLY TOTALS (INSIDE YEAR — FIXED) ----
      const monthlyIndex = yearlyMap[yearKey].monthly.findIndex(
        (m) => m.month === monthKey
      );

      if (monthlyIndex === -1) {
        yearlyMap[yearKey].monthly.push({
          month: monthKey,
          orders: 1,
          sales: getSales(o), // FIXED
          shipping: o.shippingFee || 0,
          discount: o.discount || 0,
          transactionFee: o.transactionFeeCharge || 0,
          itemsSold: o.items?.reduce((c, i) => c + i.quantity, 0) || 0,
        });
      } else {
        const m = yearlyMap[yearKey].monthly[monthlyIndex];
        m.orders += 1;
        m.sales += getSales(o); // FIXED
        m.shipping += o.shippingFee || 0;
        m.discount += o.discount || 0;
        m.transactionFee += o.transactionFeeCharge || 0;
        m.itemsSold += o.items?.reduce((c, i) => c + i.quantity, 0) || 0;
      }
    });

    // Sort years
    const yearly = Object.values(yearlyMap).sort(
      (a, b) => parseInt(a.year) - parseInt(b.year)
    );

    // Sort months inside each year
    yearly.forEach((y) => {
      y.monthly.sort(
        (a, b) =>
          new Date(a.month + "-01").getTime() -
          new Date(b.month + "-01").getTime()
      );
    });

    return {
      summary: {
        totalOrders,
        totalSales,
        totalShipping,
        totalDiscount,
        totalTransactionFee,
        totalItemsSold,
        yearly,
        from,
        to,
      },
    };
  } catch (error) {
    console.error("Yearly Summary error:", error);
    throw error;
  }
};

export const getTopSellingProducts = async (
  from?: string,
  to?: string,
  page: number = 1,
  size: number = 20
) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    const snap = await query.get();
    const productMap: Record<string, any> = {};

    snap.docs.forEach((doc) => {
      const order = doc.data();
      const shippingFee = order.shippingFee || 0;

      // Calculate total item cost before removing shipping
      const totalItemValue =
        order.items?.reduce(
          (s: number, i: any) => s + (i.price || 0) * i.quantity,
          0
        ) || 0;

      // Allocate shipping removal proportionally
      const shippingRatio =
        totalItemValue > 0 ? shippingFee / totalItemValue : 0;

      order.items?.forEach((item: any) => {
        const key = item.itemId + (item.variantId || "");

        if (!productMap[key]) {
          productMap[key] = {
            productId: item.itemId,
            variantId: item.variantId,
            name: item.name,
            variantName: item.variantName,
            totalQuantity: 0,
            totalSales: 0,
            totalDiscount: 0,
          };
        }

        const rawSales = (item.price || 0) * item.quantity;

        // Deduct proportionally allocated shipping from item sales
        const adjustedSales = rawSales - rawSales * shippingRatio;

        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalSales += adjustedSales;
        productMap[key].totalDiscount += (item.discount || 0) * item.quantity;
      });
    });

    const allProducts = Object.values(productMap).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    const total = allProducts.length;
    const startIndex = (page - 1) * size;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + size);

    return {
      topProducts: paginatedProducts,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  } catch (error) {
    console.error("Top Selling Products error:", error);
    throw error;
  }
};

export const getSalesByCategory = async (from?: string, to?: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    const snap = await query.get();

    const categoryMap: Record<string, any> = {};
    const productCache: Record<string, any> = {}; // cache products

    for (const doc of snap.docs) {
      const order = doc.data();

      const shippingFee = order.shippingFee || 0;

      // 1. Calculate total raw item sales for the order
      const totalItemSales =
        order.items?.reduce(
          (s: number, i: any) => s + (i.price || 0) * i.quantity,
          0
        ) || 0;

      // 2. Determine proportional deduction ratio
      const deductionRatio =
        totalItemSales > 0 ? shippingFee / totalItemSales : 0;

      for (const item of order.items || []) {
        // 3. Fetch product (with cache)
        let product: any;
        if (productCache[item.itemId]) {
          product = productCache[item.itemId];
        } else {
          const productSnap = await adminFirestore
            .collection("products")
            .doc(item.itemId)
            .get();
          product = productSnap.exists ? productSnap.data() : null;
          productCache[item.itemId] = product;
        }

        const category = product?.category || "Uncategorized";

        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            totalQuantity: 0,
            totalSales: 0,
            totalDiscount: 0,
            totalOrders: 0,
          };
        }

        const rawSales = (item.price || 0) * item.quantity;

        // 4. Apply proportional shipping deduction
        const adjustedSales = rawSales - rawSales * deductionRatio;

        // 5. Update category totals
        categoryMap[category].totalQuantity += item.quantity;
        categoryMap[category].totalSales += adjustedSales;
        categoryMap[category].totalDiscount += item.discount || 0;
        categoryMap[category].totalOrders += 1;
      }
    }

    const categories = Object.values(categoryMap).sort(
      (a, b) => b.totalSales - a.totalSales
    );

    return { categories };
  } catch (error) {
    console.error("Sales by Category error:", error);
    throw error;
  }
};

export const getSalesByBrand = async (from?: string, to?: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", Timestamp.fromDate(start))
        .where("createdAt", "<=", Timestamp.fromDate(end));
    }

    const snap = await query.get();

    const brandMap: Record<string, any> = {};
    const productCache: Record<string, any> = {}; // reduce reads

    for (const doc of snap.docs) {
      const order = doc.data();
      const shippingFee = order.shippingFee || 0;

      // 1. Total raw item sales in this order
      const totalItemSales =
        order.items?.reduce(
          (s: number, i: any) => s + (i.price || 0) * i.quantity,
          0
        ) || 0;

      // 2. Calculate proportional deduction ratio
      const deductionRatio =
        totalItemSales > 0 ? shippingFee / totalItemSales : 0;

      for (const item of order.items || []) {
        let product: any;

        // Lookup from cache
        if (productCache[item.itemId]) {
          product = productCache[item.itemId];
        } else {
          const productSnap = await adminFirestore
            .collection("products")
            .doc(item.itemId)
            .get();
          product = productSnap.exists ? productSnap.data() : null;
          productCache[item.itemId] = product;
        }

        const brand = product?.brand || "Unknown";

        if (!brandMap[brand]) {
          brandMap[brand] = {
            brand,
            totalQuantity: 0,
            totalSales: 0,
            totalDiscount: 0,
            totalOrders: 0,
          };
        }

        const rawSales = (item.price || 0) * item.quantity;

        // 3. Apply proportional deduction
        const adjustedSales = rawSales - rawSales * deductionRatio;

        // Update Brand totals
        brandMap[brand].totalQuantity += item.quantity;
        brandMap[brand].totalSales += adjustedSales;
        brandMap[brand].totalDiscount += item.discount || 0;
        brandMap[brand].totalOrders += 1;
      }
    }

    const brands = Object.values(brandMap).sort(
      (a, b) => b.totalSales - a.totalSales
    );

    return { brands };
  } catch (error) {
    console.error("Sales by Brand error:", error);
    throw error;
  }
};

export const getSalesVsDiscount = async (
  from?: string,
  to?: string,
  groupBy: "day" | "month" = "day"
) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    }

    const snap = await query.get();
    const reportMap: Record<string, any> = {};

    snap.docs.forEach((doc) => {
      const order = doc.data();
      const dateObj = order.createdAt.toDate
        ? order.createdAt.toDate()
        : new Date(order.createdAt);

      // Group key (day or month)
      let key = "";
      if (groupBy === "month") {
        key = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
      } else {
        key = dateObj.toISOString().split("T")[0]; // yyyy-mm-dd
      }

      if (!reportMap[key]) {
        reportMap[key] = {
          period: key,
          totalSales: 0,
          totalDiscount: 0,
          totalOrders: 0,
        };
      }

      const shippingFee = order.shippingFee || 0;
      const rawTotal = order.total || 0;

      // 🚀 Deduct shipping from sales
      const netSales = rawTotal - shippingFee;

      reportMap[key].totalSales += netSales;
      reportMap[key].totalDiscount += order.discount || 0;
      reportMap[key].totalOrders += 1;
    });

    return {
      report: Object.values(reportMap).sort((a, b) =>
        a.period > b.period ? 1 : -1
      ),
    };
  } catch (error) {
    console.error("Sales vs Discount service error:", error);
    throw error;
  }
};

const normalizeKey = (str: string = "") => {
  return str.trim().toLowerCase().replace(/\s+/g, " "); // clean double spaces
};

/** Converts normalized key ("bank transfer") → Display Name ("Bank Transfer") */
const toTitleCase = (str: string = "") => {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getSalesByPaymentMethod = async (from?: string, to?: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid");

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    }

    const snap = await query.get();
    const map: Record<string, any> = {};

    snap.docs.forEach((doc) => {
      const order = doc.data() as any;

      // === CASE 1: Split payments ===
      if (order.paymentReceived?.length) {
        order.paymentReceived.forEach((p: any) => {
          const normalized = normalizeKey(p.paymentMethod || "unknown");

          if (!map[normalized]) {
            map[normalized] = {
              paymentMethod: toTitleCase(normalized),
              totalAmount: 0,
              totalOrders: 0,
              transactions: 0,
            };
          }

          map[normalized].totalAmount += p.amount || 0;
          map[normalized].transactions += 1;
        });

        // count order for each method used
        order.paymentReceived.forEach((p: any) => {
          const normalized = normalizeKey(p.paymentMethod || "unknown");
          map[normalized].totalOrders += 1;
        });
      }

      // === CASE 2: Single payment method ===
      else {
        const normalized = normalizeKey(order.paymentMethod || "unknown");

        if (!map[normalized]) {
          map[normalized] = {
            paymentMethod: toTitleCase(normalized),
            totalAmount: 0,
            totalOrders: 0,
            transactions: 0,
          };
        }

        map[normalized].totalAmount += order.total || 0;
        map[normalized].totalOrders += 1;
        map[normalized].transactions += 1;
      }
    });

    return {
      paymentMethods: Object.values(map).sort(
        (a, b) => b.totalAmount - a.totalAmount
      ),
    };
  } catch (err) {
    console.error("Sales by payment method error:", err);
    throw err;
  }
};

export const getRefundsAndReturns = async (from?: string, to?: string) => {
  try {
    let query = adminFirestore
      .collection("orders")
      .where("paymentStatus", "in", ["Returned", "Refunded"]);

    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      query = query
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end);
    }

    const snap = await query.get();

    const result = {
      totalOrders: 0,
      totalRefundAmount: 0,
      totalRestockedItems: 0,
      items: [] as any[],
    };

    snap.docs.forEach((doc) => {
      const order = doc.data() as any;

      let refundAmount = 0;

      // If split payments exist → sum all reversed/refunded amounts
      if (order.paymentReceived?.length) {
        refundAmount = order.paymentReceived
          .filter((p: any) => p.amount < 0) // refunded amounts are negative
          .reduce((sum: number, p: any) => sum + Math.abs(p.amount), 0);
      } else {
        // Old structure (full refund)
        if (order.paymentStatus === "Refunded") refundAmount = order.total;
      }

      const restockedItems = order.items?.length ?? 0;

      result.totalOrders++;
      result.totalRefundAmount += refundAmount;
      if (order.restocked) result.totalRestockedItems += restockedItems;

      result.items.push({
        orderId: order.orderId,
        status: order.status,
        refundAmount,
        restocked: order.restocked || false,
        restockedAt: toSafeLocaleString(order.restockedAt) || null,
        createdAt: toSafeLocaleString(order.createdAt),
      });
    });

    return result;
  } catch (err) {
    console.error("Refunds & Returns report error:", err);
    throw err;
  }
};

export interface LiveStockItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string;
  stockId: string;
  stockName: string;
  quantity: number;
  buyingPrice: number;
  valuation: number;
}

export const fetchLiveStock = async (
  stockId: string = "all"
): Promise<{
  stock: LiveStockItem[];
  total: number;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValuation: number;
  };
}> => {
  try {
    let inventoryQuery: FirebaseFirestore.Query = adminFirestore
      .collection("stock_inventory")
      .orderBy("productId");

    if (stockId !== "all") {
      inventoryQuery = inventoryQuery.where("stockId", "==", stockId);
    }

    const inventorySnap = await inventoryQuery
      .get();

    const totalSnap =
      stockId === "all"
        ? await adminFirestore.collection("stock_inventory").get()
        : await adminFirestore
            .collection("stock_inventory")
            .where("stockId", "==", stockId)
            .get();

    const total = totalSnap.size;
    const stockList: LiveStockItem[] = [];

    const productIds = inventorySnap.docs.map((d) => d.data().productId);
    const stockIds = inventorySnap.docs.map((d) => d.data().stockId);

    // Helper to split array into chunks of 30
    const chunkArray = <T>(arr: T[], chunkSize: number) =>
      arr.reduce((result: T[][], item, index) => {
        const chunkIndex = Math.floor(index / chunkSize);
        result[chunkIndex] = result[chunkIndex] || [];
        result[chunkIndex].push(item);
        return result;
      }, []);

    // Fetch products in batches of 30
    const productMap: Record<string, any> = {};
    for (const chunk of chunkArray(productIds, 30)) {
      const productSnaps = await adminFirestore
        .collection("products")
        .where("productId", "in", chunk)
        .get();
      productSnaps.docs.forEach((p) => {
        const data = p.data();
        productMap[data.productId] = data;
      });
    }

    // Fetch stocks in batches of 30
    const stockMap: Record<string, any> = {};
    for (const chunk of chunkArray(stockIds, 30)) {
      const stockSnaps = await adminFirestore
        .collection("stocks")
        .where("id", "in", chunk)
        .get();
      stockSnaps.docs.forEach((s) => {
        const data = s.data();
        stockMap[data.id] = data;
      });
    }

    let totalQuantity = 0;
    let totalValuation = 0;

    inventorySnap.docs.forEach((d) => {
      const data = d.data();
      const product = productMap[data.productId];
      const stock = stockMap[data.stockId];

      const variant =
        product?.variants?.find((v: any) => v.variantId === data.variantId) ||
        {};
      const buyingPrice = product?.buyingPrice || 0;
      const valuation = buyingPrice * (data.quantity || 0);

      totalQuantity += data.quantity || 0;
      totalValuation += valuation;

      stockList.push({
        id: d.id,
        productId: data.productId,
        productName: product?.name || "",
        variantId: data.variantId,
        variantName: variant?.variantName || data.variantName || "",
        size: data.size,
        stockId: data.stockId,
        stockName: stock?.name || "",
        quantity: data.quantity || 0,
        buyingPrice,
        valuation,
      });
    });

    return {
      stock: stockList,
      total,
      summary: {
        totalProducts: stockList.length,
        totalQuantity,
        totalValuation,
      },
    };
  } catch (err) {
    console.error("Live Stock Service Error:", err);
    throw err;
  }
};

export interface LowStockItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string;
  stockId: string;
  stockName: string;
  quantity: number;
  threshold: number;
  buyingPrice?: number;
  valuation?: number;
}

export const fetchLowStock = async (
  threshold: number = 10,
  stockId: string = "all"
): Promise<{
  stock: LowStockItem[];
  total: number;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValuation: number;
  };
}> => {
  try {
    // Build query
    let inventoryQuery: FirebaseFirestore.Query = adminFirestore
      .collection("stock_inventory")
      .where("quantity", "<=", threshold)
      .orderBy("quantity", "asc");

    if (stockId !== "all") {
      inventoryQuery = inventoryQuery.where("stockId", "==", stockId);
    }

    // Fetch paginated inventory
    const inventorySnap = await inventoryQuery
      .get();

    // Total count
    const totalSnap =
      stockId === "all"
        ? await adminFirestore
            .collection("stock_inventory")
            .where("quantity", "<=", threshold)
            .get()
        : await adminFirestore
            .collection("stock_inventory")
            .where("quantity", "<=", threshold)
            .where("stockId", "==", stockId)
            .get();

    const total = totalSnap.size;

    const stockList: LowStockItem[] = [];

    // Collect productIds and stockIds
    const productIds = inventorySnap.docs.map((d) => d.data().productId);
    const stockIds = inventorySnap.docs.map((d) => d.data().stockId);

    // Helper for batching 'in' queries (max 30)
    const batchFetch = async (
      collection: string,
      field: string,
      ids: string[]
    ) => {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 30)
        chunks.push(ids.slice(i, i + 30));

      const result: FirebaseFirestore.DocumentData[] = [];
      for (const chunk of chunks) {
        const snap = await adminFirestore
          .collection(collection)
          .where(field, "in", chunk)
          .get();
        snap.docs.forEach((d) => result.push(d.data()));
      }
      return result;
    };

    // Fetch products
    const products = productIds.length
      ? await batchFetch("products", "productId", productIds)
      : [];
    const productMap: Record<string, any> = {};
    products.forEach((p) => (productMap[p.productId] = p));

    // Fetch stocks
    const stocks = stockIds.length
      ? await batchFetch("stocks", "id", stockIds)
      : [];
    const stockMap: Record<string, any> = {};
    stocks.forEach((s) => (stockMap[s.id] = s));

    let totalQuantity = 0;
    let totalValuation = 0;

    inventorySnap.docs.forEach((d) => {
      const data = d.data();
      const product = productMap[data.productId];
      const stock = stockMap[data.stockId];

      const variant =
        product?.variants?.find((v: any) => v.variantId === data.variantId) ||
        {};
      const buyingPrice = product?.buyingPrice || 0;
      const valuation = buyingPrice * (data.quantity || 0);

      totalQuantity += data.quantity || 0;
      totalValuation += valuation;

      stockList.push({
        id: d.id,
        productId: data.productId,
        productName: product?.name || "",
        variantId: data.variantId,
        variantName: variant?.variantName || data.variantName || "",
        size: data.size,
        stockId: data.stockId,
        stockName: stock?.name || "",
        quantity: data.quantity || 0,
        threshold,
        buyingPrice,
        valuation,
      });
    });

    return {
      stock: stockList,
      total,
      summary: {
        totalProducts: stockList.length,
        totalQuantity,
        totalValuation,
      },
    };
  } catch (err) {
    console.error("Low Stock Service Error:", err);
    throw err;
  }
};

export interface StockValuationItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string;
  stockId: string;
  stockName: string;
  quantity: number;
  buyingPrice: number;
  valuation: number;
}

export interface StockValuationSummary {
  totalProducts: number;
  totalQuantity: number;
  totalValuation: number;
}

const chunkArray = <T>(arr: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const fetchStockValuationByStock = async (
  stockId: string
): Promise<{ stock: StockValuationItem[]; summary: StockValuationSummary }> => {
  try {
    let inventoryQuery: FirebaseFirestore.Query =
      adminFirestore.collection("stock_inventory");

    if (stockId !== "all") {
      inventoryQuery = inventoryQuery.where("stockId", "==", stockId);
    }

    const inventorySnap = await inventoryQuery.get();

    if (inventorySnap.empty) {
      return {
        stock: [],
        summary: { totalProducts: 0, totalQuantity: 0, totalValuation: 0 },
      };
    }

    const inventoryDocs = inventorySnap.docs;
    const productIds = Array.from(
      new Set(inventoryDocs.map((d) => d.data().productId))
    );
    const stockIds = Array.from(
      new Set(inventoryDocs.map((d) => d.data().stockId))
    );

    // Fetch products in chunks of 30
    const productMap: Record<string, any> = {};
    const productChunks = chunkArray(productIds, 30);
    for (const chunk of productChunks) {
      const snap = await adminFirestore
        .collection("products")
        .where("productId", "in", chunk)
        .get();
      snap.docs.forEach((p) => {
        const data = p.data();
        productMap[data.productId] = data;
      });
    }

    // Fetch stocks in chunks of 30
    const stockMap: Record<string, any> = {};
    const stockChunks = chunkArray(stockIds, 30);
    for (const chunk of stockChunks) {
      const snap = await adminFirestore
        .collection("stocks")
        .where("id", "in", chunk)
        .get();
      snap.docs.forEach((s) => {
        const data = s.data();
        stockMap[data.id] = data;
      });
    }

    let totalQuantity = 0;
    let totalValuation = 0;

    const stockList: StockValuationItem[] = inventoryDocs.map((d) => {
      const data = d.data();
      const product = productMap[data.productId];
      const stockData = stockMap[data.stockId];
      const variant =
        product?.variants?.find((v: any) => v.variantId === data.variantId) ||
        {};
      const buyingPrice = product?.buyingPrice || 0;
      const valuation = buyingPrice * (data.quantity || 0);

      totalQuantity += data.quantity || 0;
      totalValuation += valuation;

      return {
        id: d.id,
        productId: data.productId,
        productName: product?.name || "",
        variantId: data.variantId,
        variantName: variant?.variantName || data.variantName || "",
        size: data.size,
        stockId: data.stockId,
        stockName: stockData?.name || "",
        quantity: data.quantity || 0,
        buyingPrice,
        valuation,
      };
    });

    return {
      stock: stockList,
      summary: {
        totalProducts: stockList.length,
        totalQuantity,
        totalValuation,
      },
    };
  } catch (err) {
    console.error("Stock Valuation Service Error:", err);
    throw err;
  }
};

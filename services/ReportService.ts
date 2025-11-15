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
        categoryMap[category].totalDiscount +=
          (item.discount || 0) * item.quantity;
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
        brandMap[brand].totalDiscount += (item.discount || 0) * item.quantity;
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
}

export const fetchLiveStock = async (
  page: number = 1,
  size: number = 20
): Promise<{ stock: LiveStockItem[]; total: number }> => {
  try {
    // Fetch paginated inventory
    const inventorySnap = await adminFirestore
      .collection("stock_inventory")
      .orderBy("productId")
      .offset((page - 1) * size)
      .limit(size)
      .get();

    const totalSnap = await adminFirestore.collection("stock_inventory").get();
    const total = totalSnap.size;

    const stockList: LiveStockItem[] = [];

    // Get product IDs and stock IDs for lookup
    const productIds = inventorySnap.docs.map((d) => d.data().productId);
    const stockIds = inventorySnap.docs.map((d) => d.data().stockId);

    // Fetch products
    const productSnaps = await adminFirestore
      .collection("products")
      .where("productId", "in", productIds)
      .get();
    const productMap: Record<string, any> = {};
    productSnaps.docs.forEach((p) => {
      const data = p.data();
      productMap[data.productId] = data;
    });

    // Fetch stocks
    const stockSnaps = await adminFirestore
      .collection("stocks")
      .where("id", "in", stockIds)
      .get();
    const stockMap: Record<string, any> = {};
    stockSnaps.docs.forEach((s) => {
      const data = s.data();
      stockMap[data.id] = data;
    });

    inventorySnap.docs.forEach((d) => {
      const data = d.data();
      const product = productMap[data.productId];
      const stock = stockMap[data.stockId];

      // Find variant name from product
      const variant =
        product?.variants?.find((v: any) => v.variantId === data.variantId) ||
        {};

      stockList.push({
        id: d.id,
        productId: data.productId,
        productName: product?.name || "",
        variantId: data.variantId,
        variantName: variant?.variantName || data.variantName || "",
        size: data.size,
        stockId: data.id,
        stockName: stock?.name || "", // <-- get stock name from stocks collection
        quantity: data.quantity || 0,
      });
    });

    return { stock: stockList, total };
  } catch (err) {
    console.error("Live Stock Service Error:", err);
    throw err;
  }
};

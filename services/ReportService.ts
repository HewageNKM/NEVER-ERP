import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { toSafeLocaleString } from "./UtilService";

export const getSaleReport = async (from: string, to: string) => {
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

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
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
      dailyMap[dateKey].sales += o.total || 0;
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

    query = query.orderBy("createdAt", "asc"); // ascending for monthly summary
    const snap = await query.get();

    const orders = snap.docs.map((d) => ({
      orderId: d.id,
      ...d.data(),
      createdAt: d.data().createdAt.toDate(), // Keep as Date
    }));

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
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
      if (!date || isNaN(date.getTime())) return; // skip invalid dates

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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
      monthlyMap[monthKey].sales += o.total || 0;
      monthlyMap[monthKey].shipping += o.shippingFee || 0;
      monthlyMap[monthKey].discount += o.discount || 0;
      monthlyMap[monthKey].transactionFee += o.transactionFeeCharge || 0;
      monthlyMap[monthKey].itemsSold += o.items?.reduce((c, i) => c + i.quantity, 0) || 0;
    });

    const monthly = Object.values(monthlyMap).sort(
      (a, b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime()
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
      createdAt: d.data().createdAt.toDate(), // keep as Date
    }));

    // ---------- MAIN SUMMARY ----------
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
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

    // ---------- YEARLY & MONTHLY SUMMARY ----------
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
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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

      // Update yearly totals
      yearlyMap[yearKey].orders += 1;
      yearlyMap[yearKey].sales += o.total || 0;
      yearlyMap[yearKey].shipping += o.shippingFee || 0;
      yearlyMap[yearKey].discount += o.discount || 0;
      yearlyMap[yearKey].transactionFee += o.transactionFeeCharge || 0;
      yearlyMap[yearKey].itemsSold += o.items?.reduce((c, i) => c + i.quantity, 0) || 0;

      // Update monthly inside year
      const monthlyIndex = yearlyMap[yearKey].monthly.findIndex((m) => m.month === monthKey);
      if (monthlyIndex === -1) {
        yearlyMap[yearKey].monthly.push({
          month: monthKey,
          orders: 1,
          sales: o.total || 0,
          shipping: o.shippingFee || 0,
          discount: o.discount || 0,
          transactionFee: o.transactionFeeCharge || 0,
          itemsSold: o.items?.reduce((c, i) => c + i.quantity, 0) || 0,
        });
      } else {
        const m = yearlyMap[yearKey].monthly[monthlyIndex];
        m.orders += 1;
        m.sales += o.total || 0;
        m.shipping += o.shippingFee || 0;
        m.discount += o.discount || 0;
        m.transactionFee += o.transactionFeeCharge || 0;
        m.itemsSold += o.items?.reduce((c, i) => c + i.quantity, 0) || 0;
      }
    });

    // Convert to array sorted by year ascending
    const yearly = Object.values(yearlyMap).sort(
      (a, b) => parseInt(a.year) - parseInt(b.year)
    );

    // Sort months inside each year
    yearly.forEach((y) => {
      y.monthly.sort(
        (a, b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime()
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
    let query = adminFirestore.collection("orders").where("paymentStatus", "==", "Paid");

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
      order.items?.forEach((item: any) => {
        const key = item.itemId + (item.variantId || ""); // differentiate variants

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

        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalSales += (item.price || 0) * item.quantity;
        productMap[key].totalDiscount += (item.discount || 0) * item.quantity;
      });
    });

    // Convert map to array and sort by totalQuantity
    const allProducts = Object.values(productMap).sort((a, b) => b.totalQuantity - a.totalQuantity);

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
    let query = adminFirestore.collection("orders").where("paymentStatus", "==", "Paid");

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
    const productCache: Record<string, any> = {}; // cache products to reduce reads

    for (const doc of snap.docs) {
      const order = doc.data();
      for (const item of order.items || []) {
        let product: any;

        // Check cache first
        if (productCache[item.itemId]) {
          product = productCache[item.itemId];
        } else {
          // Fetch product from "products" collection
          const productSnap = await adminFirestore.collection("products").doc(item.itemId).get();
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

        categoryMap[category].totalQuantity += item.quantity;
        categoryMap[category].totalSales += item.price * item.quantity;
        categoryMap[category].totalDiscount += item.discount * item.quantity;
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
    let query = adminFirestore.collection("orders").where("paymentStatus", "==", "Paid");

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
    const productCache: Record<string, any> = {}; // cache products to reduce reads

    for (const doc of snap.docs) {
      const order = doc.data();
      for (const item of order.items || []) {
        let product: any;

        // Use cache if available
        if (productCache[item.itemId]) {
          product = productCache[item.itemId];
        } else {
          const productSnap = await adminFirestore.collection("products").doc(item.itemId).get();
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

        brandMap[brand].totalQuantity += item.quantity;
        brandMap[brand].totalSales += item.price * item.quantity;
        brandMap[brand].totalDiscount += item.discount * item.quantity;
        brandMap[brand].totalOrders += 1;
      }
    }

    const brands = Object.values(brandMap).sort((a, b) => b.totalSales - a.totalSales);

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
    let query = adminFirestore.collection("orders").where("paymentStatus", "==", "Paid");

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
      const dateObj = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);

      let key = "";
      if (groupBy === "month") {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
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

      reportMap[key].totalSales += order.total || 0;
      reportMap[key].totalDiscount += order.discount || 0;
      reportMap[key].totalOrders += 1;
    });

    return { report: Object.values(reportMap).sort((a, b) => (a.period > b.period ? 1 : -1)) };
  } catch (error) {
    console.error("Sales vs Discount service error:", error);
    throw error;
  }
};



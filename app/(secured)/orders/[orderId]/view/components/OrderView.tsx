"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Order } from "@/model";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { IconLoader, IconAlertTriangle } from "@tabler/icons-react";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1",
  value: "text-sm font-bold text-black uppercase tracking-wide break-words",
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 pb-2 border-b-2 border-black flex items-center justify-between",
  statusBadge: (status: string, type: "payment" | "order") => {
    const s = status?.toLowerCase();
    let styleClass = "bg-gray-100 text-gray-500 border-gray-200";

    if (type === "payment") {
      if (s === "paid") styleClass = "bg-black text-white border-black";
      else if (s === "pending")
        styleClass = "bg-white text-black border-black border-2";
      else if (s === "failed")
        styleClass = "bg-red-600 text-white border-red-600";
      else if (s === "refunded")
        styleClass = "bg-orange-500 text-white border-orange-500";
    } else {
      if (s === "completed")
        styleClass = "bg-green-600 text-white border-green-600";
      else if (s === "processing")
        styleClass = "bg-blue-600 text-white border-blue-600";
    }

    return `px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${styleClass}`;
  },
};

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) fetchOrder();
  }, [currentUser]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);
      const token = await getToken();
      const res = await axios.get(`/api/v1/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data || null);
    } catch (error: any) {
      console.error(error);
      showNotification(error?.message || "Failed to fetch order", "error");
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal =
    order?.items?.reduce(
      (sum, item) =>
        sum +
        (item?.quantity || 0) * ((item?.price || 0) - (item?.discount || 0)),
      0
    ) || 0;

  const discount = order?.discount || 0;
  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;
  const transactionFeeCharge = order?.transactionFeeCharge || 0;

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-gray-200 bg-white h-[60vh]">
        <IconLoader className="animate-spin text-black mb-3" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Retrieving Order Details
        </p>
      </div>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return "—";
    return new Date(date)
      .toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .toUpperCase();
  };

  return (
    <motion.div
      className="w-full flex flex-col gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        <Link href="/orders" className="hover:text-black transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="text-black">#{order?.orderId || "—"}</span>
      </div>

      {/* ⚠️ Integrity Warning */}
      {order && order.integrity === false && (
        <div className="bg-red-600 text-white p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
          <div className="flex items-center gap-3">
            <IconAlertTriangle size={24} stroke={2} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Security Alert
              </h3>
              <p className="text-xs font-medium opacity-90">
                This order has failed integrity checks. Review contents
                carefully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-black">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 block">
            Order Detail View
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">
            #{order?.orderId}
          </h1>
        </div>
        <div className="flex gap-2">
          <span
            className={styles.statusBadge(
              order?.paymentStatus || "UNKNOWN",
              "payment"
            )}
          >
            {order?.paymentStatus}
          </span>
          <span
            className={styles.statusBadge(order?.status || "UNKNOWN", "order")}
          >
            {order?.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 🧮 Items Table */}
          <div className="bg-white border border-gray-200 p-0 shadow-sm">
            <div className="p-6 pb-0">
              <h2 className={styles.sectionTitle}>
                Order Items{" "}
                <span className="text-xs bg-black text-white px-2 py-1">
                  {order?.items?.length || 0}
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-400 uppercase text-[9px] font-bold tracking-[0.1em] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4 text-center">Size</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    // Group items: combo items by comboId, regular items separate
                    const comboGroups = new Map<string, typeof order.items>();
                    const regularItems: typeof order.items = [];

                    order?.items?.forEach((item) => {
                      if (item.isComboItem && item.comboId) {
                        if (!comboGroups.has(item.comboId)) {
                          comboGroups.set(item.comboId, []);
                        }
                        comboGroups.get(item.comboId)!.push(item);
                      } else {
                        regularItems.push(item);
                      }
                    });

                    return (
                      <>
                        {/* Regular Items */}
                        {regularItems.map((item, i) => (
                          <tr
                            key={`regular-${i}`}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-6 py-4 font-black text-black uppercase">
                              {item?.name || "—"}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-bold text-xs uppercase">
                              {item?.variantName || "—"}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-xs">
                              {item?.size || "—"}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-xs">
                              {item?.quantity || 0}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                              {Number(item?.price || 0).toLocaleString()}
                              {(item?.discount || 0) > 0 && (
                                <span className="block text-red-500 text-[10px]">
                                  - {Number(item.discount).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-black">
                              {(
                                (item?.quantity || 0) *
                                ((item?.price || 0) - (item?.discount || 0))
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))}

                        {/* Combo Groups */}
                        {Array.from(comboGroups.entries()).map(
                          ([comboId, comboItems]) => {
                            const comboName =
                              comboItems?.[0]?.comboName || "Combo Bundle";
                            const comboDiscount =
                              comboItems?.reduce(
                                (sum, i) => sum + (Number(i?.discount) || 0),
                                0
                              ) || 0;

                            return (
                              <React.Fragment key={comboId}>
                                {/* Combo Header Row */}
                                <tr className="bg-gray-100">
                                  <td
                                    colSpan={6}
                                    className="px-6 py-3 border-y border-gray-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-wider">
                                          Combo
                                        </span>
                                        <span className="font-black text-black uppercase tracking-tight">
                                          {comboName}
                                        </span>
                                      </div>
                                      {comboDiscount > 0 && (
                                        <span className="text-xs font-bold text-red-600">
                                          - {comboDiscount.toLocaleString()} LKR
                                          saved
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {/* Combo Items */}
                                {comboItems?.map((item, i) => (
                                  <tr
                                    key={`combo-${comboId}-${i}`}
                                    className="bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                                  >
                                    <td className="px-6 py-3 pl-10 font-medium text-gray-700 uppercase text-xs">
                                      └ {item?.name || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 font-medium text-xs uppercase">
                                      {item?.variantName || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-center font-mono text-xs text-gray-500">
                                      {item?.size || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-center font-mono text-xs text-gray-500">
                                      {item?.quantity || 0}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-xs text-gray-400">
                                      {Number(
                                        item?.price || 0
                                      ).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-xs text-gray-600">
                                      {(
                                        (item?.quantity || 0) *
                                        ((item?.price || 0) -
                                          (item?.discount || 0))
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          }
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🧾 Order & Payment Summary */}
          <div className="bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className={styles.sectionTitle}>Transaction Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className={styles.label}>Payment Method</span>
                  <p className={styles.value}>
                    {order?.paymentMethod}{" "}
                    <span className="text-gray-400 text-xs">
                      ({order?.paymentMethodId})
                    </span>
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Transaction ID</span>
                  <p className={`${styles.value} font-mono text-xs`}>
                    {order?.paymentId || "N/A"}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Integrity Check</span>
                  <div className="flex items-center gap-2 mt-1">
                    {order?.integrity ? (
                      <>
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <IoCheckmark size={10} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-green-600 uppercase">
                          Passed
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <IoClose size={10} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-red-600 uppercase">
                          Failed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className={styles.label}>Created At</span>
                  <p className={`${styles.value} font-mono`}>
                    {formatDate(order?.createdAt)}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Updated At</span>
                  <p className={`${styles.value} font-mono`}>
                    {formatDate(order?.updatedAt)}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Stock Source</span>
                  <p className={styles.value}>
                    {order?.from || "—"} / {order?.stockId || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Financial Summary */}
          <div className="bg-gray-50 border border-gray-200 p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
              Financials
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs">
                <span>Subtotal</span>
                <span className="font-mono text-gray-800">
                  {subtotal.toLocaleString()} LKR
                </span>
              </div>

              {/* Coupon Discount */}
              {order?.couponCode && (order?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs">
                  <div className="flex items-center gap-2">
                    <span>Coupon</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 text-[9px] font-black">
                      {order.couponCode}
                    </span>
                  </div>
                  <span className="font-mono text-green-600">
                    - {(order.couponDiscount || 0).toLocaleString()} LKR
                  </span>
                </div>
              )}

              {/* Promotion Discount */}
              {(order?.promotionDiscount || 0) > 0 && (
                <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs">
                  <div className="flex items-center gap-2">
                    <span>Promotion</span>
                    {order?.appliedPromotionId && (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[9px] font-black">
                        AUTO
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-blue-600">
                    - {(order.promotionDiscount || 0).toLocaleString()} LKR
                  </span>
                </div>
              )}

              {/* Item Discounts (combo, sale prices) */}
              {discount > 0 &&
                discount !==
                  (order?.couponDiscount || 0) +
                    (order?.promotionDiscount || 0) && (
                  <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs">
                    <span>Item Discounts</span>
                    <span className="font-mono text-red-500">
                      -{" "}
                      {(
                        discount -
                        (order?.couponDiscount || 0) -
                        (order?.promotionDiscount || 0)
                      ).toLocaleString()}{" "}
                      LKR
                    </span>
                  </div>
                )}

              <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs">
                <span>Shipping</span>
                <span className="font-mono text-gray-800">
                  {shippingFee.toLocaleString()} LKR
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-xs border-b border-gray-200 pb-3">
                <span>Fees</span>
                <span className="font-mono text-gray-800">
                  {(fee + transactionFeeCharge).toLocaleString()} LKR
                </span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-lg font-black uppercase tracking-tighter text-black">
                  Total
                </span>
                <span className="text-2xl font-black font-mono text-black leading-none">
                  {(order?.total || 0).toLocaleString()}{" "}
                  <span className="text-xs text-gray-400 font-bold align-top">
                    LKR
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          {order?.customer && (
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className={styles.sectionTitle}>Customer</h2>
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-bold text-black bg-gray-100 px-2 py-1 uppercase tracking-widest mb-2 inline-block">
                    Contact
                  </span>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-black uppercase">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {order.customer.email}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {order.customer.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-black bg-gray-100 px-2 py-1 uppercase tracking-widest mb-2 inline-block">
                    Shipping
                  </span>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p className="font-bold uppercase text-xs">
                      {order.customer.shippingName}
                    </p>
                    <p className="text-xs uppercase">
                      {order.customer.shippingAddress}
                    </p>
                    <p className="text-xs uppercase font-bold">
                      {order.customer.shippingCity} {order.customer.shippingZip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderView;

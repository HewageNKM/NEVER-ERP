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
      <div className="flex justify-center items-center w-full h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // Helper for Status Chips
  const getStatusColor = (
    status: string | undefined,
    type: "payment" | "order"
  ) => {
    const s = status?.toLowerCase();
    if (type === "payment") {
      if (s === "paid") return "bg-green-100 text-green-700";
      if (s === "pending") return "bg-yellow-100 text-yellow-700";
      if (s === "failed") return "bg-red-100 text-red-700";
      if (s === "refunded") return "bg-blue-100 text-blue-700";
      return "bg-gray-100 text-gray-700";
    } else {
      if (s === "processing") return "bg-yellow-100 text-yellow-700";
      if (s === "completed") return "bg-green-100 text-green-700";
      return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  return (
    <motion.div
      className="w-full flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">
        <Link href="/orders" className="hover:text-black transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="text-black font-bold">#{order?.orderId || "—"}</span>
      </div>

      {/* ⚠️ Integrity Warning */}
      {order && order.integrity === false && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3 text-red-700 animate-pulse">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium">
            This order has been <b>tampered with</b>. Please review carefully.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Order #{order?.orderId}
        </h1>
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(
            order?.status,
            "order"
          )}`}
        >
          {order?.status || "UNKNOWN"}
        </span>
      </div>

      {/* 🧾 Order Summary */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Order Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Left */}
          <div className="space-y-3">
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                Payment Method:
              </span>{" "}
              {order?.paymentMethod} ({order?.paymentMethodId})
            </p>
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                Payment ID:
              </span>{" "}
              <span className="font-mono">{order?.paymentId || "N/A"}</span>
            </p>
            <p className="flex items-center">
              <span className="font-bold text-gray-500 w-32 inline-block">
                Payment Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(
                  order?.paymentStatus,
                  "payment"
                )}`}
              >
                {order?.paymentStatus}
              </span>
            </p>
            <p className="flex items-center">
              <span className="font-bold text-gray-500 w-32 inline-block">
                Integrity:
              </span>
              {order?.integrity ? (
                <IoCheckmark className="text-green-600" size={18} />
              ) : (
                <IoClose className="text-red-600" size={18} />
              )}
            </p>
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                From:
              </span>{" "}
              {order?.from || "—"}
            </p>
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                Stock ID:
              </span>{" "}
              {order?.stockId || "—"}
            </p>
          </div>

          {/* Right */}
          <div className="space-y-3">
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                Created:
              </span>{" "}
              {formatDate(order?.createdAt)}
            </p>
            <p>
              <span className="font-bold text-gray-500 w-32 inline-block">
                Updated:
              </span>{" "}
              {formatDate(order?.updatedAt)}
            </p>

            {order?.restocked !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="font-bold text-gray-800 mb-2 uppercase text-xs">
                  Restock Info
                </p>
                <p className="flex items-center mb-1">
                  <span className="font-bold text-gray-500 w-32 inline-block">
                    Restocked:
                  </span>
                  {order?.restocked ? (
                    <span className="text-green-600 font-bold text-xs uppercase">
                      YES
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold text-xs uppercase">
                      NO
                    </span>
                  )}
                </p>
                <p>
                  <span className="font-bold text-gray-500 w-32 inline-block">
                    Restocked At:
                  </span>{" "}
                  {formatDate(order?.restockedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👤 Customer Details */}
      {order?.customer && (
        <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase text-gray-800 mb-4 pb-2 border-b border-gray-100">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Contact Info
              </h3>
              <p>
                <span className="font-bold">Name:</span> {order.customer.name}
              </p>
              <p>
                <span className="font-bold">Email:</span> {order.customer.email}
              </p>
              <p>
                <span className="font-bold">Phone:</span> {order.customer.phone}
              </p>
              <p>
                <span className="font-bold">Address:</span>{" "}
                {order.customer.address}, {order.customer.city}{" "}
                {order.customer.zip}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Shipping Info
              </h3>
              <p>
                <span className="font-bold">Name:</span>{" "}
                {order.customer.shippingName}
              </p>
              <p>
                <span className="font-bold">Address:</span>{" "}
                {order.customer.shippingAddress}, {order.customer.shippingCity}{" "}
                {order.customer.shippingZip}
              </p>
              <p>
                <span className="font-bold">Phone:</span>{" "}
                {order.customer.shippingPhone}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🧮 Items Table */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase text-gray-800 mb-4 pb-2 border-b border-gray-100">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3 text-right">Size</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order?.items?.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item?.variantName?.toUpperCase() || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">{item?.size || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {item?.quantity || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    Rs.{(item?.price || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-500 font-medium">
                    - Rs.{(item?.discount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    Rs.
                    {(
                      (item?.quantity || 0) *
                      ((item?.price || 0) - (item?.discount || 0))
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-1/2 md:w-1/3 text-sm space-y-2">
            <div className="flex justify-between items-center text-gray-600">
              <span>Subtotal</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <span>Discount</span>
              <span>- Rs.{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Shipping Fee</span>
              <span>Rs.{shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Other Fee</span>
              <span>Rs.{fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-500 text-xs">
              <span>Transaction Fee</span>
              <span>Rs.{transactionFeeCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-black text-lg text-black pt-4 border-t border-gray-100 uppercase mt-4">
              <span>Grand Total</span>
              <span>Rs.{(order?.total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 text-xs mt-1">
              <span>Merchant Net</span>
              <span>
                Rs.
                {(
                  (order?.total || 0) -
                  (order?.transactionFeeCharge || 0) -
                  (order?.shippingFee || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderView;

"use client";

import React, { useState } from "react";
import { Order, Customer } from "@/model";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { showNotification } from "@/utils/toast";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

interface OrderEditFormProps {
  order: Order;
  onRefresh?: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onRefresh,
}) => {
  

  const [formData, setFormData] = useState<Order>(order);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showConfirmation } = useConfirmationDialog();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: e.target.value,
    }));
  };

  const handleOrderStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const currentCustomer = prev.customer || ({} as Customer);
      return {
        ...prev,
        customer: {
          ...currentCustomer,
          [name]: value,
        },
      };
    });
  };

  const handleReset = () => setFormData(order);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    showConfirmation({
      title: "Update Order",
      message:
        order?.integrity === false
          ? "⚠️ This order has been tampered with. Are you absolutely sure you want to update it?"
          : "Are you sure you want to update this order?",
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
          const token = await getToken();

          await axios.put(`/api/v1/orders/${order.orderId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

          showNotification(
            `Order #${order.orderId} updated successfully.`,
            "success"
          );
          onRefresh?.();
        } catch (error: any) {
          console.error(error);
          showNotification(
            error.response?.data?.message || "Failed to update order",
            "error"
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    if (typeof timestamp === "string")
      return new Date(timestamp).toLocaleString();
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ⚠️ Tampered Order Warning */}
      {order && order.integrity === false && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3 text-red-700 animate-pulse">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium">
            This order has been <b>tampered with</b>. Please review carefully
            before making any changes.
          </p>
        </div>
      )}

      {/* 🧾 Order Summary Card */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Order Summary #{order?.orderId}
          </h2>
          <p className="text-sm text-gray-400">
            Overview of payment, costs, and current status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">
                Payment Method
              </span>
              <span className="font-medium">
                {order?.paymentMethod || "—"}{" "}
                <span className="text-xs text-gray-400">
                  ({order?.paymentMethodId?.toUpperCase()})
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">Payment ID</span>
              <span className="font-mono text-gray-700">
                {order?.paymentId || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">
                Payment Status
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(
                  order?.paymentStatus,
                  "payment"
                )}`}
              >
                {order?.paymentStatus || "UNKNOWN"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">Order Status</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(
                  order?.status,
                  "order"
                )}`}
              >
                {order?.status || "UNKNOWN"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">From</span>
              <span className="font-medium">{order?.from || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">
                Integrity Check
              </span>
              {order?.integrity ? (
                <span className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase">
                  <IoCheckmark size={16} /> Passed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase">
                  <IoClose size={16} /> Failed
                </span>
              )}
            </div>
          </div>

          {/* Right Column (Financials) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="font-semibold text-gray-500">Order Total</span>
              <span className="font-bold text-lg">
                {(order?.total ?? 0).toFixed(2)}{" "}
                <span className="text-xs font-normal text-gray-400">LKR</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Discount</span>
              <span>{(order?.discount ?? 0).toFixed(2)} LKR</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Shipping Fee</span>
              <span>{(order?.shippingFee ?? 0).toFixed(2)} LKR</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50 text-gray-600">
              <span className="font-medium">Transaction Fee</span>
              <span>{(order?.transactionFeeCharge ?? 0).toFixed(2)} LKR</span>
            </div>
            <div className="mt-4 pt-4 text-xs text-gray-400 flex flex-col items-end gap-1">
              <p>Created: {formatDate(order?.createdAt)}</p>
              <p>Updated: {formatDate(order?.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Quick Customer View */}
        {order?.customer && (
          <div className="mt-8 p-4 bg-gray-50 rounded-sm border border-gray-100">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">
              Customer Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold text-gray-900">{order.customer.name}</p>
                <p className="text-gray-600">{order.customer.email}</p>
                <p className="text-gray-600">{order.customer.phone}</p>
              </div>
              <div>
                <p className="text-gray-800">{order.customer.address}</p>
                <p className="text-gray-800">
                  {order.customer.city}, {order.customer.zip}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✏️ Edit Form Card */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Edit Details
          </h2>
          <p className="text-sm text-gray-400">
            Modify customer info and update order status.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Statuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="paymentStatus"
                className="text-xs font-bold uppercase text-gray-500"
              >
                Payment Status
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData?.paymentStatus}
                onChange={handleStatusChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="orderStatus"
                className="text-xs font-bold uppercase text-gray-500"
              >
                Order Status
              </label>
              <select
                id="orderStatus"
                name="status"
                value={formData?.status || ""}
                onChange={handleOrderStatusChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              >
                <option value="Cancelled">Cancelled</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Customer Edit Fields */}
          {formData?.customer && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
              {/* Billing */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase border-b border-gray-100 pb-2">
                  Billing Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "name", label: "Name", span: 1 },
                    { id: "phone", label: "Phone", span: 1 },
                    { id: "email", label: "Email", col: 2 },
                    { id: "address", label: "Address", col: 2 },
                    { id: "city", label: "City", span: 1 },
                    { id: "zip", label: "ZIP Code", span: 1 },
                  ].map((field: any) => (
                    <div
                      key={field.id}
                      className={`${field.col === 2 ? "sm:col-span-2" : ""}`}
                    >
                      <label
                        htmlFor={field.id}
                        className="block text-xs font-bold uppercase text-gray-500 mb-1"
                      >
                        {field.label}
                      </label>
                      <input
                        type={field.id === "email" ? "email" : "text"}
                        id={field.id}
                        name={field.id}
                        value={(formData.customer as any)?.[field.id] || ""}
                        onChange={handleCustomerChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase border-b border-gray-100 pb-2">
                  Shipping Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "shippingName", label: "Name", span: 1 },
                    { id: "shippingPhone", label: "Phone", span: 1 },
                    { id: "shippingAddress", label: "Address", col: 2 },
                    { id: "shippingCity", label: "City", span: 1 },
                    { id: "shippingZip", label: "ZIP Code", span: 1 },
                  ].map((field: any) => (
                    <div
                      key={field.id}
                      className={`${field.col === 2 ? "sm:col-span-2" : ""}`}
                    >
                      <label
                        htmlFor={field.id}
                        className="block text-xs font-bold uppercase text-gray-500 mb-1"
                      >
                        {field.label}
                      </label>
                      <input
                        type="text"
                        id={field.id}
                        name={field.id}
                        value={(formData.customer as any)?.[field.id] || ""}
                        onChange={handleCustomerChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              Save Changes
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReset}
              className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
            >
              Undo Changes
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

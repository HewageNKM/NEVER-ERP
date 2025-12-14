"use client";

import React, { useState } from "react";
import { Order, Customer } from "@/model";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { showNotification } from "@/utils/toast";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { IconLoader, IconAlertTriangle } from "@tabler/icons-react";

interface OrderEditFormProps {
  order: Order;
  onRefresh?: () => void;
}

// --- STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-bold px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-bold px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 pb-2 border-b-2 border-black",
};

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
      title: "UPDATE ORDER",
      message:
        order?.integrity === false
          ? "WARNING: THIS ORDER IS FLAGGED. CONFIRM UPDATE?"
          : "CONFIRM UPDATING ORDER DETAILS?",
      confirmText: "UPDATE",
      variant: order?.integrity === false ? "danger" : "default",
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
          const token = await getToken();

          await axios.put(`/api/v1/orders/${order.orderId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

          showNotification(`ORDER #${order.orderId} UPDATED`, "success");
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* ⚠️ Tampered Order Warning */}
      {order && order.integrity === false && (
        <div className="bg-red-600 text-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3">
            <IconAlertTriangle size={24} stroke={2} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Security Alert
              </h3>
              <p className="text-xs font-medium opacity-90 uppercase">
                Order flagged for integrity violation. Proceed with caution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Form Card */}
      <div className="bg-white border border-gray-200 p-8 shadow-sm">
        <h2 className={styles.sectionTitle}>Order Configuration</h2>

        <div className="flex flex-col gap-8">
          {/* Statuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className={styles.label}>Payment Status</label>
              <select
                name="paymentStatus"
                value={formData?.paymentStatus}
                onChange={handleStatusChange}
                className={styles.select}
              >
                <option value="Pending">PENDING</option>
                <option value="Paid">PAID</option>
                <option value="Failed">FAILED</option>
                <option value="Refunded">REFUNDED</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className={styles.label}>Order Status</label>
              <select
                name="status"
                value={formData?.status || ""}
                onChange={handleOrderStatusChange}
                className={styles.select}
              >
                <option value="Cancelled">CANCELLED</option>
                <option value="Processing">PROCESSING</option>
                <option value="Shipped">SHIPPED</option>
                <option value="Completed">COMPLETED</option>
              </select>
            </div>
          </div>

          {/* Customer Edit Fields */}
          {formData?.customer && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4 border-t border-gray-100">
              {/* Billing */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-black rounded-full"></span>{" "}
                  Billing Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: "name", label: "Name" },
                    { id: "email", label: "Email" },
                    { id: "phone", label: "Phone" },
                    { id: "address", label: "Address" },
                    { id: "city", label: "City" },
                    { id: "zip", label: "ZIP Code" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className={styles.label}>{field.label}</label>
                      <input
                        type="text"
                        name={field.id}
                        value={(formData.customer as any)?.[field.id] || ""}
                        onChange={handleCustomerChange}
                        className={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-black rounded-full"></span>{" "}
                  Shipping Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: "shippingName", label: "Recipient Name" },
                    { id: "shippingPhone", label: "Contact Phone" },
                    { id: "shippingAddress", label: "Street Address" },
                    { id: "shippingCity", label: "City / Town" },
                    { id: "shippingZip", label: "Postal Code" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className={styles.label}>{field.label}</label>
                      <input
                        type="text"
                        name={field.id}
                        value={(formData.customer as any)?.[field.id] || ""}
                        onChange={handleCustomerChange}
                        className={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 pt-6 border-t-2 border-black">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
            >
              {isSubmitting && (
                <IconLoader size={16} className="animate-spin" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReset}
              className="px-8 py-4 bg-white text-black border-2 border-gray-200 text-xs font-black uppercase tracking-widest hover:border-black transition-all"
            >
              Reset Form
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coupon } from "@/model/Coupon";
import { IconX, IconLoader } from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  coupon: Coupon | null;
}

const emptyCoupon: Partial<Coupon> = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  maxDiscount: 0,
  minOrderAmount: 0,
  status: "ACTIVE",
  usageLimit: 0,
  perUserLimit: 1,
  firstOrderOnly: false,
};

const CouponFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  coupon,
}) => {
  const [formData, setFormData] = useState<Partial<Coupon>>(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const isEditing = !!coupon;

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      if (coupon) {
        setFormData({ ...coupon });
        const parseDate = (d: any) => {
          if (!d) return null;
          if (d.toDate) return d.toDate();
          if (typeof d === "string") return new Date(d);
          if (d.seconds) return new Date(d.seconds * 1000);
          return new Date(d);
        };
        setStartDate(parseDate(coupon.startDate));
        setEndDate(parseDate(coupon.endDate));
      } else {
        setFormData({ ...emptyCoupon });
        setStartDate(new Date());
        setEndDate(null);
      }
    }
  }, [open, coupon]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.code) return showNotification("Code is required", "error");
    if (!startDate) return showNotification("Start date is required", "error");

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...formData,
        code: formData.code?.toUpperCase(),
        startDate: startDate,
        endDate: endDate,
        discountValue: Number(formData.discountValue),
        maxDiscount: Number(formData.maxDiscount),
        minOrderAmount: Number(formData.minOrderAmount),
        usageLimit: Number(formData.usageLimit),
        perUserLimit: Number(formData.perUserLimit),
      };

      if (isEditing && coupon) {
        await axios.put(`/api/v2/coupons/${coupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Coupon updated", "success");
      } else {
        await axios.post("/api/v2/coupons", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Coupon created", "success");
      }
      onSave();
    } catch (e: any) {
      console.error("Save failed", e);
      showNotification(e.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-2xl rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                {isEditing ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Code</label>
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="input uppercase font-bold tracking-wider"
                    placeholder="e.g. SAVE20"
                  />
                </div>
                <div>
                  <label className="label">Name (Internal)</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g. Summer Sale 20%"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Description (User Facing)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input"
                    rows={2}
                  />
                </div>
              </div>

              {/* Discount Config */}
              <div className="p-4 bg-gray-50 rounded-sm">
                <h3 className="section-title mb-4">Discount Value</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="PERCENTAGE">Percentage %</option>
                      <option value="FIXED">Fixed Amount</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Value</label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  {formData.discountType === "PERCENTAGE" && (
                    <div>
                      <label className="label">Max Discount (Cap)</label>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={formData.maxDiscount}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Min Order Amount</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={formData.minOrderAmount}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="input w-full"
                    placeholderText="Never"
                    isClearable
                  />
                </div>
              </div>

              {/* Limits & Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Total Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="input"
                    placeholder="0 = Unlimited"
                  />
                </div>
                <div>
                  <label className="label">Limit Per User</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="firstOrderOnly"
                    checked={formData.firstOrderOnly}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label
                    className="label mb-0 cursor-pointer"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        firstOrderOnly: !prev.firstOrderOnly,
                      }))
                    }
                  >
                    First Order Only
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <IconLoader className="animate-spin" size={18} />
                ) : (
                  "Save Coupon"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CouponFormModal;

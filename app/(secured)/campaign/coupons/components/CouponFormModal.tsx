"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coupon } from "@/model/Coupon";
import {
  IconX,
  IconLoader,
  IconTag,
  IconCalendarEvent,
  IconTicket,
  IconUser,
} from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { parse } from "date-fns";

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

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-2",
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
          if (typeof d === "string") {
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) return parsed;
            try {
              return parse(d, "dd/MM/yyyy, hh:mm:ss a", new Date());
            } catch {
              return null;
            }
          }
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
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        usageLimit: Number(formData.usageLimit),
        perUserLimit: Number(formData.perUserLimit),
        minOrderAmount: Number(formData.minOrderAmount),
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount
          ? Number(formData.maxDiscount)
          : undefined,
      };

      if (isEditing && coupon) {
        await axios.put(`/api/v2/coupons/${coupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("COUPON UPDATED", "success");
      } else {
        await axios.post("/api/v2/coupons", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("COUPON CREATED", "success");
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-5xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-6 md:px-8 border-b-2 border-black flex justify-between items-center shrink-0 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Voucher Management
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                  {isEditing ? "Edit Coupon" : "New Coupon"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
              >
                <IconX
                  size={20}
                  className="text-black group-hover:text-white transition-colors duration-300"
                />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-transparent">
              <div className="grid grid-cols-1 xl:grid-cols-12">
                {/* LEFT COLUMN: Main Inputs */}
                <div className="xl:col-span-7 p-4 md:p-8 border-b xl:border-b-0 xl:border-r border-gray-100 space-y-8 md:space-y-10">
                  {/* Basic Details */}
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <span className="bg-black text-white p-1 mr-2">
                        <IconTicket size={14} />
                      </span>
                      Coupon Details
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className={styles.label}>Coupon Code</label>
                        <input
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          className={`${styles.input} text-xl font-black uppercase tracking-wider`}
                          placeholder="E.G. SUMMER20"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={styles.label}>Internal Name</label>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="e.g. Summer Sale"
                          />
                        </div>
                        <div>
                          <label className={styles.label}>Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={styles.select}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="EXPIRED">EXPIRED</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={styles.label}>
                          Description (Customer Facing)
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className={styles.input}
                          rows={2}
                          placeholder="GET 20% OFF YOUR NEXT ORDER"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <span className="bg-black text-white p-1 mr-2">
                        <IconCalendarEvent size={14} />
                      </span>
                      Validity Period
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div>
                          <label className={styles.label}>Start Date</label>
                          <DatePicker
                            value={startDate}
                            onChange={(date) => setStartDate(date)}
                            className="w-full"
                            slotProps={{
                              popper: {
                                sx: { zIndex: 10005 },
                              },
                              textField: {
                                fullWidth: true,
                                size: "small",
                                sx: {
                                  backgroundColor: "#f5f5f5",
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "2px",
                                    "& fieldset": {
                                      borderColor: "transparent",
                                      borderWidth: "2px",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "#e5e5e5",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "black",
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                        <div>
                          <label className={styles.label}>Expiry Date</label>
                          <DatePicker
                            value={endDate}
                            onChange={(date) => setEndDate(date)}
                            className="w-full"
                            slotProps={{
                              popper: {
                                sx: { zIndex: 10005 },
                              },
                              textField: {
                                fullWidth: true,
                                size: "small",
                                sx: {
                                  backgroundColor: "#f5f5f5",
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "2px",
                                    "& fieldset": {
                                      borderColor: "transparent",
                                      borderWidth: "2px",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "#e5e5e5",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "black",
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </LocalizationProvider>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Config & Limits */}
                <div className="xl:col-span-5 bg-gray-50/50 p-4 md:p-8 space-y-8 md:space-y-10">
                  {/* Discount Logic - High Contrast Box */}
                  <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-black font-black uppercase tracking-tighter text-xl mb-6">
                      Discount Logic
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className={styles.label}>Discount Type</label>
                          <select
                            name="discountType"
                            value={formData.discountType}
                            onChange={handleChange}
                            className={`${styles.select} bg-gray-100 border-gray-200`}
                          >
                            <option value="PERCENTAGE">PERCENTAGE %</option>
                            <option value="FIXED">FIXED AMOUNT</option>
                            <option value="FREE_SHIPPING">FREE SHIPPING</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={styles.label}>Value</label>
                          <div className="relative">
                            <input
                              type="number"
                              name="discountValue"
                              value={formData.discountValue}
                              onChange={handleChange}
                              className="block w-full bg-black text-white text-3xl font-black px-4 py-4 rounded-sm outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                              {formData.discountType === "PERCENTAGE"
                                ? "%"
                                : "$"}
                            </span>
                          </div>
                        </div>
                        {formData.discountType === "PERCENTAGE" && (
                          <div className="col-span-2">
                            <label className={styles.label}>Max Cap</label>
                            <input
                              type="number"
                              name="maxDiscount"
                              value={formData.maxDiscount}
                              onChange={handleChange}
                              className={styles.input}
                              placeholder="Optional"
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className={styles.label}>
                            Min Order Amount
                          </label>
                          <input
                            type="number"
                            name="minOrderAmount"
                            value={formData.minOrderAmount}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Limits & Conditions */}
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <span className="bg-black text-white p-1 mr-2">
                        <IconTag size={14} />
                      </span>
                      Usage Limits
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={styles.label}>Global Limit</label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={formData.usageLimit}
                          onChange={handleChange}
                          className={styles.input}
                          placeholder="0 = ∞"
                        />
                      </div>
                      <div>
                        <label className={styles.label}>User Limit</label>
                        <input
                          type="number"
                          name="perUserLimit"
                          value={formData.perUserLimit}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Custom Checkbox */}
                    <label className="group flex items-center gap-4 cursor-pointer p-3 border border-gray-200 hover:border-black transition-colors bg-white">
                      <div
                        className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                          formData.firstOrderOnly
                            ? "bg-black border-black"
                            : "bg-transparent border-gray-300"
                        }`}
                      >
                        {formData.firstOrderOnly && (
                          <IconUser size={14} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        name="firstOrderOnly"
                        checked={formData.firstOrderOnly}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-black uppercase tracking-wide group-hover:underline">
                          New Customers Only
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          Valid for first order
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3 shrink-0 z-10">
              <button
                onClick={onClose}
                disabled={saving}
                className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full sm:flex-[2] py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-colors flex justify-center items-center gap-2"
              >
                {saving ? (
                  <IconLoader className="animate-spin" size={20} />
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

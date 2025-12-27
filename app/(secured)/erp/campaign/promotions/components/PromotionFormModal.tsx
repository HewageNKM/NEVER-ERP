"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Promotion,
  PromotionCondition,
  PromotionAction,
} from "@/model/Promotion";
import Image from "next/image";
import {
  IconX,
  IconLoader,
  IconPlus,
  IconUpload,
  IconTrash,
  IconCalendarEvent,
  IconTag,
  IconSettings,
  IconBolt,
} from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { DropdownOption } from "../../../master/products/page";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { parse } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  promotion: Promotion | null;
}

const emptyPromotion: Partial<Promotion> = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  isActive: true,
  conditions: [],
  actions: [{ type: "PERCENTAGE_OFF", value: 0 }],
  usageLimit: 0,
  usageCount: 0,
  perUserLimit: 0,
  stackable: false,
  priority: 1,
};

// --- NIKE AESTHETIC STYLES ---
const styles = {
  // Labels: Small, All Caps, Wide Spacing
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  // Inputs: Flat Gray, Sharp Corners, Black Focus
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  // Selects: Same as input but appearance-none handled by utility if needed
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  // Section Headers: Bold, Condensed, Black
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-2",
};

const PromotionFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  promotion,
}) => {
  const [formData, setFormData] = useState<Partial<Promotion>>(emptyPromotion);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const isEditing = !!promotion;

  // Dates
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts();
      setBannerFile(null);
      if (promotion) {
        setFormData({ ...promotion });
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
        setStartDate(parseDate(promotion.startDate));
        setEndDate(parseDate(promotion.endDate));
      } else {
        setFormData({ ...emptyPromotion });
        setStartDate(new Date());
        setEndDate(null);
      }
    }
  }, [open, promotion]);

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/master/products/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data || []);
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  // State for product variants (keyed by productId)
  const [productVariants, setProductVariants] = useState<{
    [productId: string]: { variantId: string; variantName: string }[];
  }>({});

  const fetchVariantsForProduct = async (productId: string) => {
    if (!productId || productVariants[productId]) return;
    try {
      const token = await getToken();
      const res = await axios.get(`/api/v2/master/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const product = res.data;
      const variants = (product?.variants || []).map((v: any) => ({
        variantId: v.variantId,
        variantName: v.variantName || v.variantId,
      }));
      setProductVariants((prev) => ({ ...prev, [productId]: variants }));
    } catch (e) {
      console.error("Failed to fetch variants for product", productId, e);
    }
  };

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { type: "MIN_AMOUNT", value: 0 },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (
    index: number,
    field: keyof PromotionCondition,
    value: any
  ) => {
    setFormData((prev) => {
      const newConditions = [...(prev.conditions || [])];
      newConditions[index] = { ...newConditions[index], [field]: value };
      return { ...prev, conditions: newConditions };
    });
  };

  const updateAction = (field: keyof PromotionAction, value: any) => {
    setFormData((prev) => {
      const newActions = [...(prev.actions || [])];
      if (newActions.length === 0)
        newActions.push({ type: "PERCENTAGE_OFF", value: 0 });

      newActions[0] = { ...newActions[0], [field]: value };
      return { ...prev, actions: newActions };
    });
  };

  const handleSubmit = async () => {
    // Required field validations
    if (!formData.name?.trim()) {
      return showNotification("Campaign name is required", "error");
    }
    if (!formData.type) {
      return showNotification("Campaign type is required", "error");
    }
    if (!startDate) {
      return showNotification("Start date is required", "error");
    }
    if (!endDate) {
      return showNotification("End date is required", "error");
    }

    // Date validation
    if (endDate && startDate && endDate < startDate) {
      return showNotification("End date must be after start date", "error");
    }

    // Action validation
    if (
      formData.actions?.[0].value === undefined ||
      formData.actions[0].value <= 0
    ) {
      return showNotification("Discount value must be greater than 0", "error");
    }

    // Limit validations
    if ((formData.usageLimit ?? 0) < 0) {
      return showNotification("Global limit cannot be negative", "error");
    }
    if ((formData.perUserLimit ?? 0) < 0) {
      return showNotification("User limit cannot be negative", "error");
    }

    setSaving(true);
    try {
      const token = await getToken();
      const payloadObj = {
        ...formData,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        priority: Number(formData.priority),
        usageLimit: Number(formData.usageLimit),
        perUserLimit: Number(formData.perUserLimit),
        actions: formData.actions?.map((a) => ({
          ...a,
          value: Number(a.value),
          maxDiscount: a.maxDiscount ? Number(a.maxDiscount) : undefined,
        })),
      };

      // Convert to FormData
      const formDataToSend = new FormData();
      if (bannerFile) {
        formDataToSend.append("banner", bannerFile);
      }

      for (const [key, value] of Object.entries(payloadObj)) {
        if (key === "bannerUrl" && !bannerFile) {
          // Keep existing bannerUrl if passed
          formDataToSend.append(key, String(value));
          continue;
        }

        if (
          [
            "conditions",
            "actions",
            "applicableProducts",
            "applicableProductVariants",
            "applicableCategories",
            "applicableBrands",
            "excludedProducts",
          ].includes(key)
        ) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value));
        }
      }

      console.log("Submitting Payload"); // DEBUG log

      if (isEditing && promotion) {
        await axios.put(`/api/v2/promotions/${promotion.id}`, formDataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("PROMOTION UPDATED", "success");
      } else {
        await axios.post("/api/v2/promotions", formDataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("PROMOTION CREATED", "success");
      }
      onSave();
    } catch (e: any) {
      console.error("Save failed", e);
      showNotification(e.response?.data?.message || "FAILED TO SAVE", "error");
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
            className="bg-white w-full max-w-6xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-6 md:px-8 border-b-2 border-black flex justify-between items-center shrink-0 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Campaign Management
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                  {isEditing ? "Edit Promotion" : "New Campaign"}
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
                        <IconTag size={14} />
                      </span>
                      Details
                    </h3>

                    {/* Banner Upload */}
                    <div className="mb-6">
                      <label className={styles.label}>Marketing Banner</label>
                      <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border-2 border-dashed border-gray-200 hover:border-black transition-colors bg-gray-50/50">
                        <div className="flex-1 w-full">
                          <label className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors mb-2">
                            <IconUpload size={14} className="mr-2" />
                            Select Image
                            <input
                              type="file"
                              className="hidden"
                              accept="image/webp, image/png, image/jpeg"
                              onChange={handleBannerChange}
                            />
                          </label>
                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                            {bannerFile
                              ? `Selected: ${bannerFile.name}`
                              : formData.bannerUrl
                              ? "Current Banner Active"
                              : "No banner selected"}
                          </div>
                        </div>

                        {(bannerFile || formData.bannerUrl) && (
                          <div className="relative w-24 h-24 bg-white border border-gray-200 p-1 shadow-sm shrink-0">
                            <Image
                              width={200}
                              height={200}
                              src={
                                bannerFile
                                  ? URL.createObjectURL(bannerFile)
                                  : formData.bannerUrl || ""
                              }
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className={styles.label}>
                          Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`${styles.input} text-lg font-bold`}
                          placeholder="E.G., AIR MAX DAY SALE"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={styles.label}>Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className={styles.input}
                          rows={2}
                          placeholder="INTERNAL NOTES OR CUSTOMER FACING TEXT"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={styles.label}>
                            Type <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="type"
                              value={formData.type}
                              onChange={handleChange}
                              className={styles.select}
                            >
                              <option value="PERCENTAGE">PERCENTAGE</option>
                              <option value="FIXED">FIXED AMOUNT</option>
                              <option value="BOGO">BUY ONE GET ONE</option>
                              <option value="FREE_SHIPPING">FREE SHIP</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={styles.label}>Status</label>
                          <label className="group flex items-center gap-4 cursor-pointer mt-2">
                            <div
                              className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                                formData.isActive
                                  ? "bg-green-600 border-green-600"
                                  : "bg-transparent border-gray-300"
                              }`}
                            >
                              {formData.isActive && (
                                <span className="text-white text-xs font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={formData.isActive}
                              onChange={handleChange}
                              className="hidden"
                            />
                            <span className="text-sm font-bold text-black uppercase tracking-wide">
                              {formData.isActive ? "Active" : "Inactive"}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div>
                        <label className="group flex items-center gap-4 cursor-pointer">
                          <div
                            className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                              formData.stackable
                                ? "bg-black border-black"
                                : "bg-transparent border-gray-300"
                            }`}
                          >
                            {formData.stackable && (
                              <IconBolt size={14} className="text-white" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            name="stackable"
                            checked={formData.stackable}
                            onChange={handleChange}
                            className="hidden"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-black uppercase tracking-wide group-hover:underline">
                              Stackable Promotion
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              Can combine with other discounts
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h3 className={styles.sectionTitle}>
                      <span className="bg-black text-white p-1 mr-2">
                        <IconCalendarEvent size={14} />
                      </span>
                      Timeline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div>
                          <label className={styles.label}>
                            Start Date <span className="text-red-500">*</span>
                          </label>
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
                          <label className={styles.label}>
                            End Date <span className="text-red-500">*</span>
                          </label>
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
                  {/* Discount Logic - High Contrast Box with Hard Shadow */}
                  <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-black font-black uppercase tracking-tighter text-xl mb-6">
                      Reward Config
                    </h3>
                    {formData.actions && formData.actions.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <label className={styles.label}>Action</label>
                          <select
                            value={formData.actions[0].type}
                            onChange={(e) =>
                              updateAction("type", e.target.value)
                            }
                            className={`${styles.select} bg-gray-100 border-gray-200`}
                          >
                            <option value="PERCENTAGE_OFF">
                              PERCENTAGE OFF
                            </option>
                            <option value="FIXED_OFF">FIXED AMOUNT OFF</option>
                            <option value="FREE_SHIPPING">FREE SHIPPING</option>
                            <option value="BOGO">BUY X GET Y</option>
                          </select>
                        </div>
                        <div>
                          <label className={styles.label}>
                            {formData.actions[0].type === "PERCENTAGE_OFF"
                              ? "Percentage Value"
                              : "Discount Amount"}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.actions[0].value}
                              onChange={(e) =>
                                updateAction("value", e.target.value)
                              }
                              className="block w-full bg-black text-white text-3xl font-black px-4 py-4 rounded-sm outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                              {formData.actions[0].type === "PERCENTAGE_OFF"
                                ? "%"
                                : "$"}
                            </span>
                          </div>
                        </div>
                        {formData.actions[0].type === "PERCENTAGE_OFF" && (
                          <div>
                            <label className={styles.label}>
                              Max Cap (Optional)
                            </label>
                            <input
                              type="number"
                              value={formData.actions[0].maxDiscount || ""}
                              onChange={(e) =>
                                updateAction("maxDiscount", e.target.value)
                              }
                              className={styles.input}
                              placeholder="E.G. 1000"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conditions */}
                  <div>
                    <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
                      <h3 className="text-lg font-black text-black uppercase tracking-tighter flex items-center gap-2">
                        <span className="bg-black text-white p-1">
                          <IconSettings size={14} />
                        </span>
                        Rules
                      </h3>
                      <button
                        onClick={addCondition}
                        className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <IconPlus size={12} /> Add Rule
                      </button>
                    </div>

                    {formData.conditions?.length === 0 ? (
                      <div className="py-6 border border-gray-200 border-dashed text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Global Applicability
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.conditions?.map((cond, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white border border-gray-200 relative group transition-all hover:border-black"
                          >
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                                  Type
                                </label>
                                <select
                                  value={cond.type}
                                  onChange={(e) =>
                                    updateCondition(idx, "type", e.target.value)
                                  }
                                  className="w-full text-xs font-bold uppercase bg-transparent outline-none border-b border-gray-100 py-1"
                                >
                                  <option value="MIN_AMOUNT">Min Amount</option>
                                  <option value="MIN_QUANTITY">Min Qty</option>
                                  <option value="SPECIFIC_PRODUCT">
                                    Product
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                                  Value
                                </label>
                                {cond.type === "SPECIFIC_PRODUCT" ? (
                                  <select
                                    value={cond.value as string}
                                    onChange={(e) => {
                                      updateCondition(
                                        idx,
                                        "value",
                                        e.target.value
                                      );
                                      // Load variants when product selected
                                      if (e.target.value) {
                                        fetchVariantsForProduct(e.target.value);
                                        // Default to ALL_VARIANTS if not set
                                        if (!cond.variantMode) {
                                          updateCondition(
                                            idx,
                                            "variantMode",
                                            "ALL_VARIANTS"
                                          );
                                        }
                                      }
                                    }}
                                    className="w-full text-xs font-bold uppercase bg-transparent outline-none border-b border-gray-100 py-1"
                                  >
                                    <option value="">Select...</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={cond.value}
                                    onChange={(e) =>
                                      updateCondition(
                                        idx,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    className="w-full text-xs font-bold uppercase bg-transparent outline-none border-b border-gray-100 py-1"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Variant Selection for SPECIFIC_PRODUCT */}
                            {cond.type === "SPECIFIC_PRODUCT" && cond.value && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                  Variant Restriction
                                </label>
                                <div className="flex gap-4 mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`variantMode-${idx}`}
                                      checked={
                                        cond.variantMode === "ALL_VARIANTS" ||
                                        !cond.variantMode
                                      }
                                      onChange={() => {
                                        updateCondition(
                                          idx,
                                          "variantMode",
                                          "ALL_VARIANTS"
                                        );
                                        updateCondition(
                                          idx,
                                          "variantIds",
                                          undefined
                                        );
                                      }}
                                      className="accent-black"
                                    />
                                    <span className="text-xs font-bold uppercase">
                                      All Variants
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`variantMode-${idx}`}
                                      checked={
                                        cond.variantMode === "SPECIFIC_VARIANTS"
                                      }
                                      onChange={() =>
                                        updateCondition(
                                          idx,
                                          "variantMode",
                                          "SPECIFIC_VARIANTS"
                                        )
                                      }
                                      className="accent-black"
                                    />
                                    <span className="text-xs font-bold uppercase">
                                      Specific Variants
                                    </span>
                                  </label>
                                </div>

                                {cond.variantMode === "SPECIFIC_VARIANTS" && (
                                  <div className="mt-2">
                                    {productVariants[cond.value as string]
                                      ?.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {productVariants[
                                          cond.value as string
                                        ].map((v) => (
                                          <label
                                            key={v.variantId}
                                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                              cond.variantIds?.includes(
                                                v.variantId
                                              )
                                                ? "bg-black text-white border-black"
                                                : "bg-gray-100 text-gray-600 border-gray-200 hover:border-black"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="hidden"
                                              checked={
                                                cond.variantIds?.includes(
                                                  v.variantId
                                                ) || false
                                              }
                                              onChange={(e) => {
                                                const currentIds =
                                                  cond.variantIds || [];
                                                const newIds = e.target.checked
                                                  ? [...currentIds, v.variantId]
                                                  : currentIds.filter(
                                                      (id) => id !== v.variantId
                                                    );
                                                updateCondition(
                                                  idx,
                                                  "variantIds",
                                                  newIds
                                                );
                                              }}
                                            />
                                            {v.variantName}
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-gray-400">
                                        Loading variants...
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => removeCondition(idx)}
                              className="absolute -top-2 -right-2 bg-black text-white p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              <IconTrash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Limits & Priority */}
                  <div>
                    <h3 className="text-lg font-black text-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                      Limits
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={styles.label}>Global Limit</label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={formData.usageLimit}
                          onChange={handleChange}
                          className={styles.input}
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
                    <div className="mt-6">
                      <label className={styles.label}>Priority (1-10)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full h-1 bg-gray-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black"
                        />
                        <span className="font-black text-2xl w-8 text-center">
                          {formData.priority}
                        </span>
                      </div>
                    </div>
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
                  "Save Campaign"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromotionFormModal;

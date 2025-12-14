"use client";
import React, { useState, useEffect } from "react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { motion, AnimatePresence } from "framer-motion";
import { ComboProduct, ComboItem } from "@/model/ComboProduct";
import {
  IconX,
  IconLoader,
  IconPlus,
  IconTrash,
  IconPackage,
  IconCurrencyDollar,
  IconCalendarEvent,
  IconUpload,
  IconLayersDifference,
} from "@tabler/icons-react";
import Image from "next/image";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { parse } from "date-fns";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { DropdownOption } from "../../../master/products/page";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  combo: ComboProduct | null;
}

const emptyCombo: Partial<ComboProduct> = {
  name: "",
  description: "",
  items: [],
  originalPrice: 0,
  comboPrice: 0,
  savings: 0,
  type: "BUNDLE",
  status: "ACTIVE",
  thumbnail: undefined,
};

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

const ComboFormModal: React.FC<Props> = ({ open, onClose, onSave, combo }) => {
  const [formData, setFormData] = useState<Partial<ComboProduct>>(emptyCombo);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const { showConfirmation } = useConfirmationDialog();

  const isEditing = !!combo;

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

  useEffect(() => {
    if (open) {
      if (combo) {
        setFormData({ ...combo });
        setStartDate(parseDate(combo.startDate));
        setEndDate(parseDate(combo.endDate));
      } else {
        setFormData({ ...emptyCombo });
        setStartDate(null);
        setEndDate(null);
      }
      setThumbnailFile(null);
      setUploadError("");
      fetchProducts();
    }
  }, [open, combo]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { productId: "", quantity: 1, required: true },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof ComboItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) {
      setThumbnailFile(null);
      setUploadError("");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Please use WEBP, PNG, or JPEG.");
      setThumbnailFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large. Max size is 1MB.");
      setThumbnailFile(null);
      return;
    }

    setUploadError("");
    setThumbnailFile(file);
  };

  const handleSubmit = async () => {
    if (!formData.name) return showNotification("Name is required", "error");
    if (!formData.items || formData.items.length === 0)
      return showNotification("At least one item required", "error");

    setSaving(true);
    try {
      const token = await getToken();
      const payload = new FormData();

      // Append basic fields
      if (formData.name) payload.append("name", formData.name);
      if (formData.description)
        payload.append("description", formData.description);
      if (formData.type) payload.append("type", formData.type);
      if (formData.status) payload.append("status", formData.status);
      payload.append("originalPrice", String(formData.originalPrice || 0));
      payload.append("comboPrice", String(formData.comboPrice || 0));
      payload.append("savings", String(formData.savings || 0));

      if (formData.buyQuantity)
        payload.append("buyQuantity", String(formData.buyQuantity));
      if (formData.getQuantity)
        payload.append("getQuantity", String(formData.getQuantity));
      if (formData.getDiscount)
        payload.append("getDiscount", String(formData.getDiscount));

      // Append dates
      if (startDate) payload.append("startDate", startDate.toISOString());
      if (endDate) payload.append("endDate", endDate.toISOString());

      // Append items as JSON string
      const items = (formData.items || []).map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        variantId: i.variantId || null,
      }));
      payload.append("items", JSON.stringify(items));

      // Append file if exists
      if (thumbnailFile) {
        payload.append("file", thumbnailFile);
      }

      if (isEditing && combo) {
        await axios.put(`/api/v2/combos/${combo.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        showNotification("COMBO UPDATED", "success");
      } else {
        await axios.post("/api/v2/combos", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        showNotification("COMBO CREATED", "success");
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
                  Product Bundles
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                  {isEditing ? "Edit Combo" : "New Bundle"}
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
                        <IconPackage size={14} />
                      </span>
                      Bundle Info
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className={styles.label}>Bundle Name</label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`${styles.input} text-xl font-bold`}
                          placeholder="E.G. WEEKEND STARTER PACK"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className={styles.label}>Thumbnail</label>
                        <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border-2 border-dashed border-gray-200 hover:border-black transition-colors bg-gray-50/50">
                          <div className="flex-1 space-y-2 w-full">
                            <label className="cursor-pointer inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                              <IconUpload size={14} className="mr-2" />
                              Select Image
                              <input
                                type="file"
                                className="hidden"
                                accept="image/webp, image/png, image/jpeg"
                                onChange={handleFileChange}
                                disabled={saving}
                              />
                            </label>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                              {thumbnailFile
                                ? `Selected: ${thumbnailFile.name}`
                                : isEditing && formData.thumbnail?.url
                                ? "Current Image Active"
                                : "No file selected (Max 1MB)"}
                            </div>
                            {uploadError && (
                              <p className="text-[10px] font-bold text-red-600 uppercase">
                                {uploadError}
                              </p>
                            )}
                          </div>

                          {(thumbnailFile ||
                            (isEditing && formData.thumbnail?.url)) && (
                            <div className="relative w-20 h-20 bg-white border border-gray-200 p-1 shadow-sm shrink-0">
                              <Image
                                width={80}
                                height={80}
                                src={
                                  thumbnailFile
                                    ? URL.createObjectURL(thumbnailFile)
                                    : formData.thumbnail?.url || ""
                                }
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={styles.label}>Type</label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className={styles.select}
                          >
                            <option value="BUNDLE">STANDARD BUNDLE</option>
                            <option value="BOGO">BUY X GET Y</option>
                            <option value="MULTI_BUY">MULTI-BUY</option>
                          </select>
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
                            <option value="DRAFT">DRAFT</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={styles.label}>Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className={styles.input}
                          rows={2}
                          placeholder="BUNDLE DETAILS..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
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

                  {/* Items Builder */}
                  <div>
                    <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
                      <h3 className={styles.sectionTitle + " mb-0"}>
                        <span className="bg-black text-white p-1 mr-2">
                          <IconLayersDifference size={14} />
                        </span>
                        Items ({formData.items?.length || 0})
                      </h3>
                      <button
                        onClick={addItem}
                        className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <IconPlus size={12} /> Add Product
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.items?.length === 0 && (
                        <div className="py-8 border border-gray-200 border-dashed text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            No Items Added
                          </p>
                        </div>
                      )}
                      {formData.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-gray-200 hover:border-black transition-colors relative group"
                        >
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-8">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                                Product
                              </label>
                              <select
                                value={item.productId}
                                onChange={(e) =>
                                  updateItem(idx, "productId", e.target.value)
                                }
                                className="w-full text-xs font-bold uppercase bg-transparent outline-none border-b border-gray-100 py-1 focus:border-black transition-colors"
                              >
                                <option value="">Select...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-3">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                                Qty
                              </label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full text-xs font-bold bg-transparent outline-none border-b border-gray-100 py-1 focus:border-black transition-colors"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                onClick={() => removeItem(idx)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Config & Pricing */}
                <div className="xl:col-span-5 bg-gray-50/50 p-4 md:p-8 space-y-8">
                  {/* Pricing Box - High Contrast */}
                  <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-black font-black uppercase tracking-tighter text-xl mb-6 flex items-center gap-2">
                      <IconCurrencyDollar size={20} />
                      Pricing Logic
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className={styles.label}>
                          Total Original Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            LKR
                          </span>
                          <input
                            type="number"
                            name="originalPrice"
                            value={formData.originalPrice}
                            onChange={handleChange}
                            className={`${styles.input} pl-10 border-gray-200 bg-white`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dashed border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Selling At
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className={styles.label}>Bundle Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                            LKR
                          </span>
                          <input
                            type="number"
                            name="comboPrice"
                            value={formData.comboPrice}
                            onChange={handleChange}
                            className="block w-full bg-black text-white text-3xl font-black pl-14 pr-4 py-4 rounded-sm outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Calculated Savings */}
                      {(Number(formData.originalPrice) > 0 ||
                        Number(formData.comboPrice) > 0) && (
                        <div className="flex justify-between items-center bg-gray-100 p-3 rounded-sm border border-gray-200">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Calculated Savings
                          </span>
                          <span className="text-sm font-black text-black">
                            LKR{" "}
                            {(
                              Number(formData.originalPrice) -
                              Number(formData.comboPrice)
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
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
                  "Save Bundle"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComboFormModal;

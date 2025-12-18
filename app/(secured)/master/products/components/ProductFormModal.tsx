"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/model/Product";
import { DropdownOption } from "../page";
import { ProductVariant } from "@/model/ProductVariant";
import VariantList from "./VariantList";
import VariantFormModal from "./VariantFormModal";
import Image from "next/image";
import { showNotification } from "@/utils/toast";
import {
  IconX,
  IconUpload,
  IconLoader,
  IconPackage,
} from "@tabler/icons-react";

const emptyProduct: Omit<Product, "itemId"> & { itemId: string | null } = {
  name: "",
  category: "",
  brand: "",
  description: "",
  thumbnail: { order: 0, url: "", file: "" },
  variants: [],
  weight: 0,
  buyingPrice: 0,
  sellingPrice: 0,
  marketPrice: 0,
  discount: 0,
  listing: true,
  status: true,
  tags: [],
};

type ProductErrors = Partial<Record<keyof Product, string>> & {
  thumbnail?: string;
};

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product, file: File | null) => void;
  product: Product | null;
  brands: DropdownOption[];
  categories: DropdownOption[];
  sizes: DropdownOption[];
  saving: boolean;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50",
  secondaryBtn:
    "flex items-center justify-center px-6 py-4 border-2 border-transparent hover:border-gray-200 text-black text-xs font-black uppercase tracking-widest transition-all",
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSave,
  product,
  brands,
  categories,
  sizes,
  saving,
}) => {
  const [formData, setFormData] = useState<Product | typeof emptyProduct>(
    emptyProduct
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );

  const [errors, setErrors] = useState<ProductErrors>({});
  const isEditing = !!product;

  useEffect(() => {
    if (open) {
      setFormData(product ? { ...product } : { ...emptyProduct });
      setThumbnailFile(null);
      setErrors({});
    }
  }, [product, open]);

  // --- Handlers ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (errors[name as keyof ProductErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (errors[name as keyof ProductErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) {
      setThumbnailFile(null);
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
      return;
    }

    let error = "";
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      error = "Invalid file type. Please use WEBP, PNG, or JPEG.";
    } else if (file.size > MAX_FILE_SIZE) {
      error = "File is too large. Max size is 1MB.";
    }

    if (error) {
      setErrors((prev) => ({ ...prev, thumbnail: error }));
      setThumbnailFile(null);
    } else {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
      setThumbnailFile(file);
    }
  };

  // --- Variant Handlers ---
  const handleOpenAddVariant = () => {
    setEditingVariantIndex(null);
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (index: number) => {
    setEditingVariantIndex(index);
    setIsVariantModalOpen(true);
  };

  const handleCloseVariantModal = () => {
    setIsVariantModalOpen(false);
    setEditingVariantIndex(null);
  };

  const handleDeleteVariant = async (index: number) => {
    if (
      window.confirm(
        "REMOVE VARIANT? This action will be saved when you update the product."
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSaveVariant = (variantData: ProductVariant) => {
    setFormData((prev) => {
      const newVariants = [...(prev.variants || [])];
      const variantIdToUpdate = variantData.variantId;

      const existingIndex = newVariants.findIndex(
        (v) => v.variantId === variantIdToUpdate
      );

      if (existingIndex !== -1) {
        newVariants[existingIndex] = variantData;
      } else if (
        editingVariantIndex !== null &&
        editingVariantIndex < newVariants.length
      ) {
        newVariants[editingVariantIndex] = variantData;
      } else {
        newVariants.push(variantData);
      }
      return { ...prev, variants: newVariants };
    });
  };

  // --- Validation & Save ---
  const validateForm = (): boolean => {
    const newErrors: ProductErrors = {};
    if (!formData.name.trim()) newErrors.name = "REQUIRED";
    if (!formData.category) newErrors.category = "REQUIRED";
    if (!formData.brand) newErrors.brand = "REQUIRED";
    if (Number(formData.weight) <= 0) newErrors.weight = "INVALID";
    if (Number(formData.sellingPrice) <= 0) newErrors.sellingPrice = "INVALID";
    if (Number(formData.buyingPrice) < 0) newErrors.buyingPrice = "INVALID";
    if (Number(formData.marketPrice) < 0) newErrors.marketPrice = "INVALID";
    if (Number(formData.discount) < 0) newErrors.discount = "INVALID";
    if (!isEditing && !thumbnailFile) newErrors.thumbnail = "REQUIRED";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    try {
      if (validateForm()) {
        const finalProductData = {
          ...formData,
          variants: formData.variants || [],
        };
        onSave(finalProductData as Product, thumbnailFile);
      }
    } catch (error) {
      console.error("Save failed in modal:", error);
      showNotification("Failed to save product", "error");
    }
  };

  const editingVariant =
    isEditing &&
    editingVariantIndex !== null &&
    formData.variants &&
    editingVariantIndex < formData.variants.length
      ? formData.variants[editingVariantIndex]
      : null;

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="bg-white w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border-2 border-black"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-8 border-b-2 border-black bg-white shrink-0">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
                    <IconPackage size={14} /> Product Management
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-black leading-none">
                    {isEditing ? "Modify Product" : "New Entry"}
                  </h2>
                </div>
                <button
                  onClick={saving ? undefined : onClose}
                  disabled={saving}
                  className="group relative flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-black transition-colors duration-300"
                >
                  <IconX
                    size={24}
                    className="text-black group-hover:text-white transition-colors"
                  />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Thumbnail Section */}
                <div>
                  <label className={styles.label}>Main Visual</label>
                  <div className="flex flex-col sm:flex-row items-start gap-6 p-6 border-2 border-dashed border-gray-200 hover:border-black transition-colors bg-gray-50/50">
                    <div className="flex-1 space-y-4 w-full">
                      <label className="cursor-pointer inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                        <IconUpload size={16} className="mr-2" />
                        Select Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/webp, image/png, image/jpeg"
                          onChange={handleFileChange}
                          disabled={saving}
                        />
                      </label>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        {thumbnailFile
                          ? `Selected: ${thumbnailFile.name}`
                          : isEditing && formData.thumbnail?.url
                          ? "Current Image Active"
                          : "No file selected (Max 1MB)"}
                      </div>
                      {errors.thumbnail && (
                        <p className="text-xs font-bold text-red-600 uppercase">
                          {errors.thumbnail}
                        </p>
                      )}
                    </div>

                    {(thumbnailFile ||
                      (isEditing && formData.thumbnail?.url)) && (
                      <div className="relative w-40 h-40 bg-white border border-gray-200 p-2 shadow-sm">
                        <Image
                          width={300}
                          height={300}
                          src={
                            thumbnailFile
                              ? URL.createObjectURL(thumbnailFile)
                              : formData.thumbnail?.url || ""
                          }
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <label className={styles.label}>
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={saving}
                      className={`${styles.input} ${
                        errors.name ? "border-red-500 bg-red-50" : ""
                      }`}
                      placeholder="ENTER PRODUCT NAME..."
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Weight (g)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={saving}
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={saving}
                    className={`${styles.input} min-h-[120px] resize-none`}
                    placeholder="ENTER DETAILS..."
                  />
                </div>

                {/* Categories & Brands */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={styles.label}>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        handleSelectChange("category", e.target.value)
                      }
                      disabled={saving}
                      className={`${styles.select} ${
                        errors.category ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">SELECT...</option>
                      {categories.map((opt) => (
                        <option key={opt.id} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>Brand</label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        handleSelectChange("brand", e.target.value)
                      }
                      disabled={saving}
                      className={`${styles.select} ${
                        errors.brand ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">SELECT...</option>
                      {brands.map((opt) => (
                        <option key={opt.id} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="p-6 bg-gray-50 border border-gray-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
                    Pricing Strategy
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className={styles.label}>Selling Price</label>
                      <input
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        disabled={saving}
                        className={`${styles.input} bg-white`}
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Market Price</label>
                      <input
                        type="number"
                        name="marketPrice"
                        value={formData.marketPrice}
                        onChange={handleChange}
                        disabled={saving}
                        className={`${styles.input} bg-white`}
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Cost Price</label>
                      <input
                        type="number"
                        name="buyingPrice"
                        value={formData.buyingPrice}
                        onChange={handleChange}
                        disabled={saving}
                        className={`${styles.input} bg-white`}
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Discount %</label>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        disabled={saving}
                        className={`${styles.input} bg-white`}
                      />
                    </div>
                  </div>
                  {/* Discounted Price Display */}
                  {Number(formData.discount) > 0 &&
                    Number(formData.sellingPrice) > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-sm">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.15em]">
                          Discounted Price:{" "}
                        </span>
                        <span className="text-lg font-black text-green-700">
                          Rs.{" "}
                          {Math.round(
                            (Number(formData.sellingPrice) *
                              (1 - Number(formData.discount) / 100)) /
                              10
                          ) * 10}
                        </span>
                        <span className="text-xs text-green-600 ml-2">
                          (rounded to nearest 10)
                        </span>
                      </div>
                    )}
                </div>

                {/* Toggles */}
                <div className="flex gap-8 p-4 border-2 border-transparent bg-[#f5f5f5]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                        formData.listing
                          ? "bg-black border-black"
                          : "bg-white border-gray-400"
                      }`}
                    >
                      {formData.listing && <div className="w-2 h-2 bg-white" />}
                    </div>
                    <input
                      type="checkbox"
                      name="listing"
                      checked={formData.listing}
                      onChange={handleChange}
                      disabled={saving}
                      className="hidden"
                    />
                    <span className="text-xs font-bold text-black uppercase tracking-wide">
                      Public Listing
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                        formData.status
                          ? "bg-black border-black"
                          : "bg-white border-gray-400"
                      }`}
                    >
                      {formData.status && <div className="w-2 h-2 bg-white" />}
                    </div>
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleChange}
                      disabled={saving}
                      className="hidden"
                    />
                    <span className="text-xs font-bold text-black uppercase tracking-wide">
                      Active Status
                    </span>
                  </label>
                </div>

                {/* Variants */}
                {isEditing && (
                  <div className="pt-8 border-t-2 border-black">
                    <VariantList
                      variants={formData.variants || []}
                      onAddVariant={handleOpenAddVariant}
                      onEditVariant={handleOpenEditVariant}
                      onDeleteVariant={handleDeleteVariant}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-gray-200 bg-white flex justify-end gap-4 shrink-0 z-10">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={styles.primaryBtn}
                >
                  {saving ? (
                    <>
                      <IconLoader size={18} className="animate-spin mr-2" />
                      Processing
                    </>
                  ) : (
                    "Save Product"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing && product && (
        <VariantFormModal
          open={isVariantModalOpen}
          onClose={handleCloseVariantModal}
          onSave={handleSaveVariant}
          variant={editingVariant}
          sizes={sizes}
          productId={product.productId}
        />
      )}
    </>
  );
};

export default ProductFormModal;

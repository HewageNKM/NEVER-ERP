"use client";
import React, { useState, useEffect } from "react";
import { Product } from "@/model/Product";
import { DropdownOption } from "../page";
import { ProductVariant } from "@/model/ProductVariant";
import VariantList from "./VariantList";
import VariantFormModal from "./VariantFormModal";
import Image from "next/image";
import { showNotification } from "@/utils/toast";
import { IconX, IconUpload, IconLoader } from "@tabler/icons-react";

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

  // --- General Form Handlers ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    // Handle checkbox/switch manually since types might vary
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

  // --- Thumbnail File Handler ---
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

  // --- Variant Modal Handlers ---
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
        "Are you sure you want to remove this variant locally? It will be permanently deleted when you save the product."
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

  // --- Validation & Main Save Handler ---
  const validateForm = (): boolean => {
    const newErrors: ProductErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (Number(formData.weight) <= 0)
      newErrors.weight = "Weight must be greater than 0";
    if (Number(formData.sellingPrice) <= 0)
      newErrors.sellingPrice = "Selling price must be greater than 0";
    if (Number(formData.buyingPrice) < 0)
      newErrors.buyingPrice = "Buying price cannot be negative";
    if (Number(formData.marketPrice) < 0)
      newErrors.marketPrice = "Market price cannot be negative";
    if (Number(formData.discount) < 0)
      newErrors.discount = "Discount cannot be negative";
    if (!isEditing && !thumbnailFile)
      newErrors.thumbnail = "Thumbnail image is required";
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
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
        {/* Modal Container */}
        <div className="bg-white w-full max-w-4xl rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
              {isEditing ? "Edit Product" : "Create New Product"}
            </h2>
            <button
              onClick={saving ? undefined : onClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <IconX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thumbnail Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
                Product Thumbnail
              </label>
              <div className="flex flex-wrap items-center gap-4 p-4 border border-dashed border-gray-300 rounded-sm bg-gray-50">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <IconUpload size={18} className="mr-2" />
                  Upload Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/webp, image/png, image/jpeg"
                    onChange={handleFileChange}
                    disabled={saving}
                  />
                </label>

                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-500">
                    {thumbnailFile
                      ? thumbnailFile.name
                      : isEditing && formData.thumbnail?.url
                      ? "Current image will be kept"
                      : "No file selected"}
                  </p>
                  {errors.thumbnail && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.thumbnail}
                    </p>
                  )}
                </div>

                {(thumbnailFile || (isEditing && formData.thumbnail?.url)) && (
                  <div className="relative w-32 h-32 rounded-sm overflow-hidden border border-gray-200">
                    <Image
                      width={300}
                      height={300}
                      src={
                        thumbnailFile
                          ? URL.createObjectURL(thumbnailFile)
                          : formData.thumbnail?.url || ""
                      }
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.weight ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.weight && (
                  <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category} // Assuming label is stored, adjust if logic requires ID
                  onChange={(e) =>
                    handleSelectChange("category", e.target.value)
                  }
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white transition-colors ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Brand
                </label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={(e) => handleSelectChange("brand", e.target.value)}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white transition-colors ${
                    errors.brand ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Brand</option>
                  {brands.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.brand && (
                  <p className="text-xs text-red-500 mt-1">{errors.brand}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Selling Price
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.sellingPrice ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.sellingPrice && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.sellingPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Market Price
                </label>
                <input
                  type="number"
                  name="marketPrice"
                  value={formData.marketPrice}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.marketPrice ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.marketPrice && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.marketPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Buying Price
                </label>
                <input
                  type="number"
                  name="buyingPrice"
                  value={formData.buyingPrice}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.buyingPrice ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.buyingPrice && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.buyingPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors ${
                    errors.discount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.discount && (
                  <p className="text-xs text-red-500 mt-1">{errors.discount}</p>
                )}
              </div>
            </div>

            <div className="flex gap-8">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="listing"
                  checked={formData.listing}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="text-sm font-bold text-gray-700 uppercase">
                  Listing
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="text-sm font-bold text-gray-700 uppercase">
                  Status (Active)
                </span>
              </label>
            </div>

            {/* Tags Display */}
            {isEditing && formData.tags && formData.tags.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase mb-2">
                  Generated Keywords (Read-Only)
                </p>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-sm bg-gray-50 max-h-24 overflow-y-auto">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white border border-gray-300 text-xs font-semibold text-gray-700 uppercase rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {isEditing && (
              <div className="pt-4 border-t border-gray-100">
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
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-200 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <IconLoader size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </div>
      </div>

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

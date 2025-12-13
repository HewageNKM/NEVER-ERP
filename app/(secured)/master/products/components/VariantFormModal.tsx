"use client";
import React, { useState, useEffect } from "react";
import { ProductVariant } from "@/model/ProductVariant";
import { DropdownOption } from "../page";
import { IconPhotoPlus, IconX, IconLoader } from "@tabler/icons-react";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";

// ... (validation constants) ...
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface VariantFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
  variant: ProductVariant | null;
  sizes: DropdownOption[];
  productId: string;
}

// --- Update emptyVariant ---
const emptyVariant: ProductVariant = {
  variantId: "",
  variantName: "",
  images: [],
  sizes: [],
  status: true,
};

const VariantFormModal: React.FC<VariantFormModalProps> = ({
  open,
  onClose,
  onSave,
  variant,
  sizes,
  productId,
}) => {
  const [formData, setFormData] = useState<ProductVariant>(emptyVariant);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showNotification } = useSnackbar();
  const isEditing = !!variant;
  const isNewVariant =
    !isEditing || (variant && variant.variantId.startsWith("var_"));

  useEffect(() => {
    if (open) {
      if (variant) {
        setFormData({ status: true, ...variant });
      } else {
        setFormData({ ...emptyVariant, variantId: `var_${Date.now()}` });
      }
      setNewImageFiles([]);
      setImageErrors([]);
      setIsSaving(false);
    }
  }, [variant, open]);

  const handleChange = (
    name: string,
    value: any,
    type?: string,
    checked?: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" || type === "switch" ? checked : value,
    }));
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Basic multi-select handling or just simpler handling for now
    // Since native select multiple is UX heavy, let's use a simple checkbox list for sizes
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    handleChange("sizes", selectedOptions);
  };

  const toggleSize = (sizeLabel: string) => {
    setFormData((prev) => {
      const currentSizes = prev.sizes || [];
      if (currentSizes.includes(sizeLabel)) {
        return { ...prev, sizes: currentSizes.filter((s) => s !== sizeLabel) };
      } else {
        return { ...prev, sizes: [...currentSizes, sizeLabel] };
      }
    });
  };

  // --- Image Handling Logic ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageErrors([]);
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type (use PNG, JPEG, WEBP).`);
        return;
      }
      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File is too large (max 1MB).`);
        return;
      }
      validFiles.push(file);
    });

    setNewImageFiles((prev) => [...prev, ...validFiles]);
    setImageErrors(errors);
  };

  const removeNewFile = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    showNotification(
      "Image marked for removal. Save variant to confirm.",
      "info"
    );
  };

  // --- End Image Handling ---

  const validateVariantForm = (): boolean => {
    if (!formData.variantName.trim()) {
      showNotification("Variant Name is required.", "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateVariantForm()) return;

    setIsSaving(true);
    try {
      // 1. Create FormData
      const formDataPayload = new FormData();

      // 2. Append variant data (stringifying complex types)
      formDataPayload.append("variantId", formData.variantId);
      formDataPayload.append("variantName", formData.variantName);
      formDataPayload.append("sizes", JSON.stringify(formData.sizes || []));
      formDataPayload.append("images", JSON.stringify(formData.images || []));
      // --- Append status ---
      formDataPayload.append("status", String(formData.status ?? true));

      // 3. Append *new* image files
      newImageFiles.forEach((file) => {
        formDataPayload.append("newImages", file, file.name);
      });

      // 4. Determine API endpoint and method
      const token = await getToken();
      const method = isNewVariant ? "POST" : "PUT";
      const url = isNewVariant
        ? `/api/v2/master/products/${productId}/variants`
        : `/api/v2/master/products/${productId}/variants/${formData.variantId}`;

      // 5. Make the API call
      const response = await axios({
        method: method,
        url: url,
        data: formDataPayload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 6. API returns the complete, saved variant data
      const savedVariant: ProductVariant = response.data;

      // 7. Update parent state with the final data & close
      onSave(savedVariant);
      showNotification(
        `Variant ${
          isNewVariant ? "added" : "updated"
        } successfully. Remember to save the product.`,
        "success"
      );
      onClose();
    } catch (error: any) {
      console.error("Failed to save variant:", error);
      const message =
        error.response?.data?.message ||
        "Failed to save variant. Please try again.";
      showNotification(message, "error");
      setImageErrors([
        "An error occurred during save. Please check details and try again.",
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
            {isEditing ? "Edit Variant" : "Add New Variant"}
          </h2>
          <button
            onClick={isSaving ? undefined : onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
              Variant Name
            </label>
            <input
              type="text"
              value={formData.variantName}
              onChange={(e) => handleChange("variantName", e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
              Available Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((sizeOption) => {
                const isSelected = (formData.sizes || []).includes(
                  sizeOption.label
                );
                return (
                  <button
                    key={sizeOption.id}
                    type="button"
                    onClick={() => !isSaving && toggleSize(sizeOption.label)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase border rounded-sm transition-all ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                    }`}
                    disabled={isSaving}
                  >
                    {sizeOption.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="status"
                checked={formData.status ?? true}
                onChange={(e) =>
                  handleChange("status", "", "switch", e.target.checked)
                }
                disabled={isSaving}
                className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-bold text-gray-700 uppercase">
                Active Status
              </span>
            </label>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 uppercase mb-2">
              Variant Images (Max 1MB each)
            </p>
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-bold uppercase rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <IconPhotoPlus size={18} className="mr-2" />
              Upload Images
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/webp, image/png, image/jpeg"
                onChange={handleFileChange}
                disabled={isSaving}
              />
            </label>

            {imageErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {imageErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {(formData.images || []).map((img, index) => (
                <div
                  key={img.url || `existing-${index}`}
                  className="relative w-20 h-20 rounded-sm overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={img.url}
                    alt="variant"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeExistingImage(index)}
                    disabled={isSaving}
                    className="absolute top-0 right-0 p-1 bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
              {newImageFiles.map((file, index) => (
                <div
                  key={file.name + index}
                  className="relative w-20 h-20 rounded-sm overflow-hidden border border-gray-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={(e) =>
                      URL.revokeObjectURL((e.target as HTMLImageElement).src)
                    }
                  />
                  <button
                    onClick={() => removeNewFile(index)}
                    disabled={isSaving}
                    className="absolute top-0 right-0 p-1 bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-200 rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {isSaving ? (
              <>
                <IconLoader size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Variant"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantFormModal;

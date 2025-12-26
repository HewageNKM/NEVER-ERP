"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductVariant } from "@/model/ProductVariant";
import { DropdownOption } from "../page";
import { IconPhotoPlus, IconX, IconLoader } from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";

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

const emptyVariant: ProductVariant = {
  variantId: "",
  variantName: "",
  images: [],
  sizes: [],
  status: true,
};

// --- STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  primaryBtn:
    "flex items-center justify-center px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50",
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

  // --- Image Handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageErrors([]);
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large.`);
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
  };

  const handleSubmit = async () => {
    if (!formData.variantName.trim()) {
      showNotification("VARIANT NAME REQUIRED", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("variantId", formData.variantId);
      formDataPayload.append("variantName", formData.variantName);
      formDataPayload.append("sizes", JSON.stringify(formData.sizes || []));
      formDataPayload.append("images", JSON.stringify(formData.images || []));
      formDataPayload.append("status", String(formData.status ?? true));

      newImageFiles.forEach((file) => {
        formDataPayload.append("newImages", file, file.name);
      });

      const token = await getToken();
      const method = isNewVariant ? "POST" : "PUT";
      const url = isNewVariant
        ? `/api/v2/master/products/${productId}/variants`
        : `/api/v2/master/products/${productId}/variants/${formData.variantId}`;

      const response = await axios({
        method: method,
        url: url,
        data: formDataPayload,
        headers: { Authorization: `Bearer ${token}` },
      });

      onSave(response.data);
      showNotification(
        `VARIANT ${isNewVariant ? "ADDED" : "UPDATED"}`,
        "success"
      );
      onClose();
    } catch (error: any) {
      console.error("Failed to save variant:", error);
      showNotification("SAVE FAILED", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-2 border-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center p-6 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase tracking-tighter text-black">
                {isEditing ? "Edit Variant" : "Add Variant"}
              </h2>
              <button
                onClick={isSaving ? undefined : onClose}
                disabled={isSaving}
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors"
              >
                <IconX
                  size={20}
                  className="text-black group-hover:text-white transition-colors"
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div>
                <label className={styles.label}>Variant Name</label>
                <input
                  type="text"
                  value={formData.variantName}
                  onChange={(e) => handleChange("variantName", e.target.value)}
                  disabled={isSaving}
                  className={styles.input}
                  placeholder="E.g. Red / Blue / Limited Edition"
                />
              </div>

              <div>
                <label className={styles.label}>Size Availability</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sizeOption) => {
                    const isSelected = (formData.sizes || []).includes(
                      sizeOption.label
                    );
                    return (
                      <button
                        key={sizeOption.id}
                        type="button"
                        onClick={() =>
                          !isSaving && toggleSize(sizeOption.label)
                        }
                        className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black"
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
                <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-transparent bg-[#f5f5f5]">
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
                    checked={formData.status ?? true}
                    onChange={(e) =>
                      handleChange("status", "", "switch", e.target.checked)
                    }
                    disabled={isSaving}
                    className="hidden"
                  />
                  <span className="text-xs font-bold text-black uppercase tracking-wide">
                    Active Status
                  </span>
                </label>
              </div>

              <div>
                <p className={styles.label}>Gallery</p>
                <label className="inline-flex items-center px-6 py-3 border-2 border-gray-200 text-xs font-bold uppercase tracking-widest text-black bg-white hover:border-black transition-all cursor-pointer w-full justify-center">
                  <IconPhotoPlus size={16} className="mr-2" />
                  Select Images
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
                  <div className="mt-2 space-y-1 p-2 bg-red-50 border border-red-200">
                    {imageErrors.map((err, i) => (
                      <p
                        key={i}
                        className="text-[10px] font-bold text-red-600 uppercase"
                      >
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Existing Images */}
                  {(formData.images || []).map((img, index) => (
                    <div
                      key={img.url || `existing-${index}`}
                      className="relative w-20 h-20 border border-gray-200 group bg-gray-50"
                    >
                      <img
                        src={img.url}
                        alt="variant"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeExistingImage(index)}
                        disabled={isSaving}
                        className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconX size={12} />
                      </button>
                    </div>
                  ))}

                  {/* New Files */}
                  {newImageFiles.map((file, index) => (
                    <div
                      key={file.name + index}
                      className="relative w-20 h-20 border border-black group bg-gray-50"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <button
                        onClick={() => removeNewFile(index)}
                        disabled={isSaving}
                        className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center bg-red-600 text-white"
                      >
                        <IconX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-4 text-xs font-black uppercase tracking-widest text-black border-2 border-transparent hover:border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className={styles.primaryBtn}
              >
                {isSaving ? (
                  <>
                    <IconLoader size={16} className="animate-spin mr-2" />
                    Processing
                  </>
                ) : (
                  "Save Variant"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VariantFormModal;

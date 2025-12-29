"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownOption } from "@/app/(secured)/erp/master/products/page";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { InventoryItem } from "@/model/InventoryItem";
import { IconX, IconLoader, IconBoxSeam } from "@tabler/icons-react";

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string; // variantId
  label: string; // variantName
  sizes: string[];
}

interface StockFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  item: InventoryItem | null;
  products: DropdownOption[];
  sizes: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const emptyItem: Omit<InventoryItem, "id"> = {
  productId: "",
  variantId: "",
  size: "",
  stockId: "",
  quantity: 0,
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

const InventoryFormModal: React.FC<StockFormModalProps> = ({
  open,
  onClose,
  onSave,
  item,
  products,
  stockLocations,
}) => {
  const [formData, setFormData] = useState(emptyItem);
  const [variants, setVariants] = useState<VariantDropdownOption[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<VariantDropdownOption | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuantity, setLoadingQuantity] = useState(false);
  const isEditing = !!item;

  useEffect(() => {
    if (open) {
      setSaving(false);
      setLoadingQuantity(false);

      if (item) {
        const initializeEditForm = async () => {
          fetchVariants(item.productId, item.variantId);
          setLoadingQuantity(true);
          let currentQuantity = item.quantity;
          try {
            const token = await getToken();
            const response = await axios.get(
              "/api/v2/inventory/check-quantity",
              {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                  productId: item.productId,
                  variantId: item.variantId,
                  size: item.size,
                  stockId: item.stockId,
                },
              }
            );
            currentQuantity = response.data.quantity ?? item.quantity;
          } catch (error) {
            console.error(
              "Failed to fetch current quantity, using prop data:",
              error
            );
          } finally {
            setLoadingQuantity(false);
          }

          setFormData({
            productId: item.productId,
            variantId: item.variantId,
            size: item.size,
            stockId: item.stockId,
            quantity: currentQuantity,
          });
        };

        initializeEditForm();
      } else {
        setFormData(emptyItem);
        setVariants([]);
        setSelectedVariant(null);
      }
    }
  }, [item, open]);

  const fetchVariants = async (
    productId: string | null,
    preselectVariantId?: string
  ) => {
    if (!productId) {
      setVariants([]);
      setSelectedVariant(null);
      setFormData((prev) => ({ ...prev, variantId: "", size: "" }));
      return;
    }
    setLoadingVariants(true);
    setSelectedVariant(null);
    setFormData((prev) => ({ ...prev, variantId: "", size: "" }));
    try {
      const token = await getToken();
      const response = await axios.get(
        `/api/v2/master/products/${productId}/variants/dropdown`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedVariants: VariantDropdownOption[] = response.data || [];
      setVariants(fetchedVariants);
      if (preselectVariantId) {
        const initialVariant = fetchedVariants.find(
          (v) => v.id === preselectVariantId
        );
        if (initialVariant) {
          setSelectedVariant(initialVariant);
        }
      }
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const numValue = parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : Math.max(0, numValue),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, productId: value }));
    if (value) {
      fetchVariants(value);
    } else {
      setVariants([]);
      setSelectedVariant(null);
    }
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selected = variants.find((v) => v.id === value) || null;
    setSelectedVariant(selected);
    setFormData((prev) => ({
      ...prev,
      variantId: value,
      size: "", // Reset size
    }));
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, size: e.target.value }));
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, stockId: e.target.value }));
  };

  const availableSizes = useMemo(() => {
    if (!selectedVariant || !selectedVariant.sizes) return [];
    return selectedVariant.sizes.map(
      (sizeLabel): DropdownOption => ({ id: sizeLabel, label: sizeLabel })
    );
  }, [selectedVariant]);

  const handleSubmit = async () => {
    if (
      !formData.productId ||
      !formData.variantId ||
      !formData.size ||
      !formData.stockId ||
      formData.quantity < 0
    ) {
      console.error("Validation Failed: Missing required fields.");
      return;
    }

    if (!selectedVariant?.sizes?.includes(formData.size)) {
      console.error("Validation Failed: Invalid size for variant.");
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...(item || {}),
        ...formData,
        quantity: Number(formData.quantity),
      };
      await onSave(saveData);
    } catch (error) {
      console.error("Save failed in modal:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (
      !open ||
      isEditing ||
      !formData.productId ||
      !formData.variantId ||
      !formData.size ||
      !formData.stockId
    ) {
      return;
    }

    const fetchExistingQuantity = async () => {
      setLoadingQuantity(true);
      try {
        const token = await getToken();
        const response = await axios.get("/api/v2/inventory/check-quantity", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            productId: formData.productId,
            variantId: formData.variantId,
            size: formData.size,
            stockId: formData.stockId,
          },
        });

        const currentQuantity = response.data?.quantity ?? 0;

        if (currentQuantity > 0) {
          setFormData((prev) => ({
            ...prev,
            quantity: currentQuantity,
          }));
        }
      } catch (error) {
        console.error("Error checking existing stock quantity:", error);
      } finally {
        setLoadingQuantity(false);
      }
    };

    fetchExistingQuantity();
  }, [
    formData.productId,
    formData.variantId,
    formData.size,
    formData.stockId,
    open,
  ]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-white/80 backdrop-blur-md p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-lg shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b-2 border-black flex justify-between items-center shrink-0 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Inventory Control
                </span>
                <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter leading-none">
                  {isEditing ? "Edit Stock" : "Add Stock"}
                </h2>
              </div>
              <button
                onClick={saving ? undefined : onClose}
                disabled={saving}
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
              >
                <IconX
                  size={20}
                  className="text-black group-hover:text-white transition-colors duration-300"
                />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              <div>
                <label className={styles.label}>Product</label>
                <select
                  value={formData.productId}
                  onChange={handleProductChange}
                  disabled={saving || isEditing}
                  className={styles.select}
                >
                  <option value="">SELECT PRODUCT...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={styles.label + " mb-0"}>Variant</label>
                  {loadingVariants && (
                    <IconLoader size={12} className="animate-spin text-black" />
                  )}
                </div>
                <select
                  value={formData.variantId}
                  onChange={handleVariantChange}
                  disabled={saving || !formData.productId || isEditing}
                  className={styles.select}
                >
                  <option value="">SELECT VARIANT...</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={styles.label}>Size</label>
                  <select
                    value={formData.size}
                    onChange={handleSizeChange}
                    disabled={saving || isEditing || !selectedVariant}
                    className={styles.select}
                  >
                    <option value="">SELECT SIZE...</option>
                    {availableSizes.map((s) => (
                      <option key={s.id} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Stock Location</label>
                  <select
                    value={formData.stockId}
                    onChange={handleStockChange}
                    disabled={saving || isEditing}
                    className={styles.select}
                  >
                    <option value="">SELECT LOCATION...</option>
                    {stockLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Input with Visual Feedback */}
              <div className="pt-2">
                <div className="flex justify-between items-end mb-2">
                  <label className={styles.label + " mb-0"}>Quantity</label>
                  {loadingQuantity && (
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center">
                      <IconLoader size={10} className="animate-spin mr-1" />{" "}
                      Checking Logic...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    disabled={saving || loadingQuantity}
                    className="block w-full bg-black text-white text-3xl font-black px-4 py-4 rounded-sm outline-none placeholder:text-gray-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase tracking-widest pointer-events-none">
                    UNITS
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white p-6 border-t border-gray-200 flex justify-end gap-3 z-10">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-black border border-transparent hover:border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || loadingQuantity}
                className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <IconLoader size={16} className="animate-spin mr-2" />
                    Saving
                  </>
                ) : (
                  "Save Stock"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InventoryFormModal;

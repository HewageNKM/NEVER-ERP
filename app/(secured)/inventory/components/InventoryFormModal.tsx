"use client";
import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/app/(secured)/master/products/page";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { InventoryItem } from "@/model/InventoryItem";
import { IconX, IconLoader } from "@tabler/icons-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
            {isEditing ? "Edit Stock Quantity" : "Add Stock Entry"}
          </h2>
          <button
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
              Product
            </label>
            <select
              value={formData.productId}
              onChange={handleProductChange}
              disabled={saving || isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            >
              <option value="">Select Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700 uppercase">
                Variant
              </label>
              {loadingVariants && (
                <IconLoader size={12} className="animate-spin text-gray-500" />
              )}
            </div>
            <select
              value={formData.variantId}
              onChange={handleVariantChange}
              disabled={saving || !formData.productId || isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
            >
              <option value="">Select Variant...</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Size
              </label>
              <select
                value={formData.size}
                onChange={handleSizeChange}
                disabled={saving || isEditing || !selectedVariant}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
              >
                <option value="">Select Size...</option>
                {availableSizes.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Stock Location
              </label>
              <select
                value={formData.stockId}
                onChange={handleStockChange}
                disabled={saving || isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="">Select Location...</option>
                {stockLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700 uppercase">
                Quantity
              </label>
              {loadingQuantity && (
                <span className="text-xs text-blue-600 flex items-center font-semibold">
                  <IconLoader size={12} className="animate-spin mr-1" /> Check
                  Logic...
                </span>
              )}
            </div>

            <input
              type="number"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              disabled={saving || loadingQuantity}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>
        </div>

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
            disabled={saving || loadingQuantity}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <IconLoader size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryFormModal;

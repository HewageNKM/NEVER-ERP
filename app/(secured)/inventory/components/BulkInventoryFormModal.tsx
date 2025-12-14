"use client";
import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/app/(secured)/master/products/page";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { IconX, IconLoader, IconStack2 } from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string;
  label: string;
  sizes: string[];
}

interface BulkInventoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  products: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const BulkInventoryFormModal: React.FC<BulkInventoryFormModalProps> = ({
  open,
  onClose,
  onSave,
  products,
  stockLocations,
}) => {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [stockId, setStockId] = useState("");
  const [variants, setVariants] = useState<VariantDropdownOption[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<VariantDropdownOption | null>(null);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(
    {}
  );
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({});
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setProductId("");
      setVariantId("");
      setStockId("");
      setVariants([]);
      setSelectedVariant(null);
      setSizeQuantities({});
      setCurrentStock({});
      setSaving(false);
    }
  }, [open]);

  // Fetch current stock when variant and stockId are both selected
  useEffect(() => {
    const fetchCurrentStock = async () => {
      if (!productId || !variantId || !stockId || !selectedVariant) {
        setCurrentStock({});
        return;
      }

      setLoadingStock(true);
      const stockData: Record<string, number> = {};

      try {
        const token = await getToken();
        // Fetch current stock for each size
        const promises = selectedVariant.sizes.map(async (size) => {
          try {
            const response = await axios.get(
              "/api/v2/inventory/check-quantity",
              {
                headers: { Authorization: `Bearer ${token}` },
                params: { productId, variantId, size, stockId },
              }
            );
            stockData[size] = response.data?.quantity ?? 0;
          } catch {
            stockData[size] = 0;
          }
        });

        await Promise.all(promises);
        setCurrentStock(stockData);

        // Pre-fill quantities with current stock
        setSizeQuantities(stockData);
      } catch (error) {
        console.error("Failed to fetch current stock:", error);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchCurrentStock();
  }, [productId, variantId, stockId, selectedVariant]);

  // Fetch variants when product changes
  const fetchVariants = async (pid: string) => {
    if (!pid) {
      setVariants([]);
      setSelectedVariant(null);
      setVariantId("");
      return;
    }
    setLoadingVariants(true);
    setSelectedVariant(null);
    setVariantId("");
    setSizeQuantities({});
    setCurrentStock({});
    try {
      const token = await getToken();
      const response = await axios.get(
        `/api/v2/master/products/${pid}/variants/dropdown`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariants(response.data || []);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProductId(value);
    if (value) {
      fetchVariants(value);
    } else {
      setVariants([]);
      setSelectedVariant(null);
    }
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setVariantId(value);
    const selected = variants.find((v) => v.id === value) || null;
    setSelectedVariant(selected);

    // Initialize size quantities with 0
    if (selected) {
      const initialQuantities: Record<string, number> = {};
      selected.sizes.forEach((size) => {
        initialQuantities[size] = 0;
      });
      setSizeQuantities(initialQuantities);
      setCurrentStock({});
    } else {
      setSizeQuantities({});
      setCurrentStock({});
    }
  };

  const handleQuantityChange = (size: string, value: string) => {
    const numValue = parseInt(value, 10);
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: isNaN(numValue) ? 0 : Math.max(0, numValue),
    }));
  };

  // Count changed entries (different from current stock)
  const changedCount = useMemo(() => {
    return Object.entries(sizeQuantities).filter(
      ([size, qty]) => qty !== (currentStock[size] ?? 0)
    ).length;
  }, [sizeQuantities, currentStock]);

  const handleSubmit = async () => {
    if (!productId || !variantId || !stockId) {
      showNotification(
        "Please select Product, Variant, and Location",
        "warning"
      );
      return;
    }

    if (changedCount === 0) {
      showNotification("No changes to save", "info");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        bulk: true,
        productId,
        variantId,
        stockId,
        sizeQuantities: Object.entries(sizeQuantities)
          .filter(([size, qty]) => qty !== (currentStock[size] ?? 0))
          .map(([size, quantity]) => ({ size, quantity })),
      };

      const response = await axios.post("/api/v2/inventory", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification(
        `Bulk entry complete! ${response.data.success} sizes updated.`,
        "success"
      );
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Bulk save failed:", error);
      showNotification(
        error.response?.data?.message || "Failed to save",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <IconStack2 size={24} className="text-gray-700" />
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
              Bulk Add Stock
            </h2>
          </div>
          <button
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {/* Product Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
              Product
            </label>
            <select
              value={productId}
              onChange={handleProductChange}
              disabled={saving}
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

          {/* Variant Select */}
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
              value={variantId}
              onChange={handleVariantChange}
              disabled={saving || !productId || loadingVariants}
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

          {/* Stock Location Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
              Stock Location
            </label>
            <select
              value={stockId}
              onChange={(e) => setStockId(e.target.value)}
              disabled={saving}
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

          {/* Size Quantities Grid */}
          {selectedVariant && selectedVariant.sizes.length > 0 && (
            <div className="overflow-x-hidden">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700 uppercase">
                  Quantities by Size
                </label>
                <div className="flex items-center gap-2">
                  {loadingStock && (
                    <IconLoader
                      size={12}
                      className="animate-spin text-gray-500"
                    />
                  )}
                  <span className="text-xs text-gray-500">
                    {changedCount} / {selectedVariant.sizes.length} changed
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedVariant.sizes.map((size) => {
                  const current = currentStock[size] ?? 0;
                  const newQty = sizeQuantities[size] ?? 0;
                  const isChanged = newQty !== current;
                  return (
                    <div
                      key={size}
                      className={`flex flex-col p-3 border rounded-sm transition-colors ${
                        isChanged
                          ? "bg-blue-50 border-blue-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700 uppercase">
                          {size}
                        </span>
                        <span className="text-xs text-gray-500">
                          Now: {current}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={sizeQuantities[size] ?? 0}
                        onChange={(e) =>
                          handleQuantityChange(size, e.target.value)
                        }
                        disabled={saving || loadingStock}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No sizes message */}
          {selectedVariant && selectedVariant.sizes.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-sm">
              <p className="text-sm font-bold uppercase">
                No sizes defined for this variant
              </p>
              <p className="text-xs mt-1">
                Please add sizes to the variant first
              </p>
            </div>
          )}

          {/* Prompt to select variant */}
          {!selectedVariant && productId && !loadingVariants && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-sm">
              <p className="text-sm font-bold uppercase">
                Select a variant to enter quantities
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-sm text-gray-600">
            {changedCount > 0 && (
              <span>
                <strong>{changedCount}</strong> size
                {changedCount > 1 ? "s" : ""} will be updated
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-200 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || changedCount === 0}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <IconLoader size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                `Save ${changedCount} Changes`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkInventoryFormModal;

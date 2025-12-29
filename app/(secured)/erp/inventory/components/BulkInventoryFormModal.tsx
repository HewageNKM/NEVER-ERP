"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownOption } from "@/app/(secured)/erp/master/products/page";
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

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
};

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
      showNotification("Missing Required Selections", "warning");
      return;
    }

    if (changedCount === 0) {
      showNotification("No changes detected", "info");
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
        `BULK ENTRY SUCCESS: ${response.data.success} UPDATED`,
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
            className="bg-white w-full max-w-3xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b-2 border-black flex justify-between items-center shrink-0 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Mass Update
                </span>
                <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter leading-none">
                  Bulk Stock Entry
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

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 bg-white">
              {/* Product Select */}
              <div>
                <label className={styles.label}>Product</label>
                <select
                  value={productId}
                  onChange={handleProductChange}
                  disabled={saving}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Variant Select */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={styles.label + " mb-0"}>Variant</label>
                    {loadingVariants && (
                      <IconLoader
                        size={12}
                        className="animate-spin text-black"
                      />
                    )}
                  </div>
                  <select
                    value={variantId}
                    onChange={handleVariantChange}
                    disabled={saving || !productId || loadingVariants}
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

                {/* Stock Location Select */}
                <div>
                  <label className={styles.label}>Stock Location</label>
                  <select
                    value={stockId}
                    onChange={(e) => setStockId(e.target.value)}
                    disabled={saving}
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

              {/* Size Quantities Grid */}
              {selectedVariant && selectedVariant.sizes.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-lg font-black text-black uppercase tracking-tight">
                      Size Distribution
                    </label>
                    <div className="flex items-center gap-2">
                      {loadingStock && (
                        <IconLoader
                          size={12}
                          className="animate-spin text-gray-500"
                        />
                      )}
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-gray-100 px-2 py-1">
                        {changedCount} / {selectedVariant.sizes.length} Changed
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedVariant.sizes.map((size) => {
                      const current = currentStock[size] ?? 0;
                      const newQty = sizeQuantities[size] ?? 0;
                      const isChanged = newQty !== current;
                      return (
                        <div
                          key={size}
                          className={`flex flex-col p-3 border-2 transition-colors relative group ${
                            isChanged
                              ? "bg-black border-black text-white"
                              : "bg-white border-gray-200 hover:border-black"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-black uppercase ${
                                isChanged ? "text-white" : "text-black"
                              }`}
                            >
                              {size}
                            </span>
                            <span
                              className={`text-[9px] font-mono tracking-wider ${
                                isChanged ? "text-gray-400" : "text-gray-400"
                              }`}
                            >
                              PREV: {current}
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
                            className={`w-full bg-transparent text-xl font-black text-center focus:outline-none ${
                              isChanged ? "text-white" : "text-black"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No sizes message */}
              {selectedVariant && selectedVariant.sizes.length === 0 && (
                <div className="py-12 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No sizes defined for this variant
                  </p>
                </div>
              )}

              {/* Prompt to select variant */}
              {!selectedVariant && productId && !loadingVariants && (
                <div className="py-12 border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Select a variant to populate grid
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {changedCount > 0 ? (
                  <span className="text-black">
                    Saving updates for <strong>{changedCount}</strong> sizes
                  </span>
                ) : (
                  "No changes pending"
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-black border border-transparent hover:border-gray-200 transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || changedCount === 0}
                  className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl flex-1 sm:flex-none"
                >
                  {saving ? (
                    <>
                      <IconLoader size={16} className="animate-spin mr-2" />
                      Saving
                    </>
                  ) : (
                    `Save Bulk Entry`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkInventoryFormModal;

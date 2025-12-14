"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComboProduct, ComboItem } from "@/model/ComboProduct";
import { IconX, IconLoader, IconPlus, IconTrash } from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { DropdownOption } from "../../master/products/page";

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
};

const ComboFormModal: React.FC<Props> = ({ open, onClose, onSave, combo }) => {
  const [formData, setFormData] = useState<Partial<ComboProduct>>(emptyCombo);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);

  const isEditing = !!combo;

  useEffect(() => {
    if (open) {
      if (combo) {
        setFormData({ ...combo });
      } else {
        setFormData({ ...emptyCombo });
      }
      fetchProducts();
    }
  }, [open, combo]);

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      // Assuming this endpoint exists and returns {id, label}
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

  const handleSubmit = async () => {
    if (!formData.name) return showNotification("Name is required", "error");
    if (!formData.items || formData.items.length === 0)
      return showNotification("At least one item required", "error");

    setSaving(true);
    try {
      const token = await getToken();
      // Calculate savings automatically if not set
      // (Simplified logic, ideally we fetch product prices to calc originalPrice if not manual)

      const payload = {
        ...formData,
        originalPrice: Number(formData.originalPrice),
        comboPrice: Number(formData.comboPrice),
        // savings = original - combo
        savings: Number(formData.originalPrice) - Number(formData.comboPrice),
      };

      if (isEditing && combo) {
        await axios.put(`/api/v2/combos/${combo.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Combo updated", "success");
      } else {
        await axios.post("/api/v2/combos", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Combo created", "success");
      }
      onSave();
    } catch (e: any) {
      console.error("Save failed", e);
      showNotification(e.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-3xl rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                {isEditing ? "Edit Combo" : "Create Combo"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g. Starter Pack"
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="BUNDLE">Normal Bundle</option>
                    <option value="BOGO">Buy X Get Y</option>
                    <option value="MULTI_BUY">Multi-Buy</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input"
                    rows={2}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-sm">
                <div>
                  <label className="label">Original Price (Sum of Items)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Combo Price (Discounted)</label>
                  <input
                    type="number"
                    name="comboPrice"
                    value={formData.comboPrice}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              {/* Items Builder */}
              <div className="border border-gray-200 p-4 rounded-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="section-title">Bundle Items</h3>
                  <button
                    onClick={addItem}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    <IconPlus size={14} className="mr-1" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-end bg-gray-50 p-2 rounded"
                    >
                      <div className="flex-[2]">
                        <label className="label text-xs">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(idx, "productId", e.target.value)
                          }
                          className="input text-sm py-1"
                        >
                          <option value="">Select Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="label text-xs">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", Number(e.target.value))
                          }
                          className="input text-sm py-1"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <IconLoader className="animate-spin" size={18} />
                ) : (
                  "Save Combo"
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

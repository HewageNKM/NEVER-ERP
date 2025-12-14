"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Promotion,
  PromotionCondition,
  PromotionAction,
} from "@/model/Promotion";
import { IconX, IconLoader, IconPlus, IconTrash } from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { DropdownOption } from "../../master/products/page"; // Reusing type
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Timestamp } from "firebase/firestore";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  promotion: Promotion | null;
}

const emptyPromotion: Partial<Promotion> = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  status: "ACTIVE",
  conditions: [],
  actions: [{ type: "PERCENTAGE_OFF", value: 0 }],
  usageLimit: 0,
  usageCount: 0,
  perUserLimit: 0,
  stackable: false,
  priority: 1,
};

const PromotionFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  promotion,
}) => {
  const [formData, setFormData] = useState<Partial<Promotion>>(emptyPromotion);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const isEditing = !!promotion;

  // Dates
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts();
      if (promotion) {
        setFormData({ ...promotion });
        // Handle dates: convert from Timestamp or string to Date
        const sDate = promotion.startDate;
        const eDate = promotion.endDate;

        // Helper to parse date
        const parseDate = (d: any) => {
          if (!d) return null;
          if (d.toDate) return d.toDate(); // Firestore Timestamp
          if (typeof d === "string") return new Date(d);
          if (d.seconds) return new Date(d.seconds * 1000); // Raw timestamp obj
          return new Date(d);
        };

        setStartDate(parseDate(sDate));
        setEndDate(parseDate(eDate));
      } else {
        setFormData({ ...emptyPromotion });
        setStartDate(new Date());
        setEndDate(null);
      }
    }
  }, [open, promotion]);

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
    const { name, value, type } = e.target;
    // Checkbox handling
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- Conditions Logic ---
  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { type: "MIN_AMOUNT", value: 0 },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (
    index: number,
    field: keyof PromotionCondition,
    value: any
  ) => {
    setFormData((prev) => {
      const newConditions = [...(prev.conditions || [])];
      newConditions[index] = { ...newConditions[index], [field]: value };
      return { ...prev, conditions: newConditions };
    });
  };

  // --- Action Logic ---
  // Currently assuming single action, but array structure allows for growth
  const updateAction = (field: keyof PromotionAction, value: any) => {
    setFormData((prev) => {
      const newActions = [...(prev.actions || [])];
      if (newActions.length === 0)
        newActions.push({ type: "PERCENTAGE_OFF", value: 0 });

      newActions[0] = { ...newActions[0], [field]: value };
      return { ...prev, actions: newActions };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) return showNotification("Name is required", "error");
    if (!startDate) return showNotification("Start date is required", "error");

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...formData,
        startDate: startDate, // API/Firestore will handle conversion or we send ISO string
        endDate: endDate,
        // Ensure numbers
        priority: Number(formData.priority),
        usageLimit: Number(formData.usageLimit),
        perUserLimit: Number(formData.perUserLimit),
        // Ensure action values are numbers
        actions: formData.actions?.map((a) => ({
          ...a,
          value: Number(a.value),
          maxDiscount: a.maxDiscount ? Number(a.maxDiscount) : undefined,
        })),
      };

      if (isEditing && promotion) {
        await axios.put(`/api/v2/promotions/${promotion.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Promotion updated", "success");
      } else {
        await axios.post("/api/v2/promotions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Promotion created", "success");
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
                {isEditing ? "Edit Promotion" : "Create Promotion"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Summer Sale"
                  />
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
                <div>
                  <label className="label">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="PERCENTAGE">Percentage Discount</option>
                    <option value="FIXED">Fixed Amount Discount</option>
                    <option value="BOGO">Buy One Get One</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                    {/* Combo is likely handled via Combo Products page usually, but can be here too */}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-sm">
                <div>
                  <label className="label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="input w-full"
                    placeholderText="No expiry"
                    isClearable
                  />
                </div>
              </div>

              {/* Discount / Action Config */}
              <div className="border border-gray-200 p-4 rounded-sm">
                <h3 className="section-title mb-4">Discount Configuration</h3>
                {formData.actions && formData.actions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Discount Type</label>
                      <select
                        value={formData.actions[0].type}
                        onChange={(e) => updateAction("type", e.target.value)}
                        className="input"
                      >
                        <option value="PERCENTAGE_OFF">Percentage Off</option>
                        <option value="FIXED_OFF">Fixed Amount Off</option>
                        <option value="FREE_SHIPPING">Free Shipping</option>
                        <option value="BOGO">Buy X Get Y</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Value</label>
                      <input
                        type="number"
                        value={formData.actions[0].value}
                        onChange={(e) => updateAction("value", e.target.value)}
                        className="input"
                        placeholder={
                          formData.actions[0].type === "PERCENTAGE_OFF"
                            ? "Percentage %"
                            : "Amount"
                        }
                      />
                    </div>
                    {formData.actions[0].type === "PERCENTAGE_OFF" && (
                      <div>
                        <label className="label">
                          Max Discount Cap (Optional)
                        </label>
                        <input
                          type="number"
                          value={formData.actions[0].maxDiscount || ""}
                          onChange={(e) =>
                            updateAction("maxDiscount", e.target.value)
                          }
                          className="input"
                          placeholder="e.g. 1000"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conditions Builder */}
              <div className="border border-gray-200 p-4 rounded-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="section-title">Conditions (Rules)</h3>
                  <button
                    onClick={addCondition}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    <IconPlus size={14} className="mr-1" /> Add Condition
                  </button>
                </div>

                {formData.conditions?.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No conditions set. Applies to all matching items.
                  </p>
                )}

                <div className="space-y-3">
                  {formData.conditions?.map((cond, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-end bg-gray-50 p-2 rounded"
                    >
                      <div className="flex-1">
                        <label className="label text-xs">Type</label>
                        <select
                          value={cond.type}
                          onChange={(e) =>
                            updateCondition(idx, "type", e.target.value)
                          }
                          className="input text-sm py-1"
                        >
                          <option value="MIN_AMOUNT">Min Order Amount</option>
                          <option value="MIN_QUANTITY">Min Quantity</option>
                          <option value="SPECIFIC_PRODUCT">
                            Specific Product
                          </option>
                          {/* Add more as needed */}
                        </select>
                      </div>

                      {cond.type === "SPECIFIC_PRODUCT" ? (
                        <div className="flex-1">
                          <label className="label text-xs">Product ID</label>
                          <select
                            value={cond.value as string}
                            onChange={(e) =>
                              updateCondition(idx, "value", e.target.value)
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
                      ) : (
                        <div className="flex-1">
                          <label className="label text-xs">Value</label>
                          <input
                            type="text"
                            value={cond.value}
                            onChange={(e) =>
                              updateCondition(idx, "value", e.target.value)
                            }
                            className="input text-sm py-1"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => removeCondition(idx)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Total Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Per User Limit</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="stackable"
                  checked={formData.stackable}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="label mb-0">
                  Stackable (Can be used with other promos)
                </label>
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
                  "Save Promotion"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromotionFormModal;

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconLoader, IconUpload } from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";

interface PettyCashFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  entry: PettyCash | null; // null = create, otherwise edit
}

const emptyForm = {
  amount: "",
  category: "",
  subCategory: "",
  note: "",
  paymentMethod: "cash",
  type: "expense" as "expense" | "income",
};

const PettyCashFormModal: React.FC<PettyCashFormModalProps> = ({
  open,
  onClose,
  onSave,
  entry,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = !!entry;
  const isDisabled = isEditing && entry?.status === "APPROVED";

  useEffect(() => {
    if (open) {
      if (entry) {
        setFormData({
          amount: String(entry.amount),
          category: entry.category || "",
          subCategory: entry.subCategory || "",
          note: entry.note || "",
          paymentMethod: entry.paymentMethod || "cash",
          type: entry.type || "expense",
        });
      } else {
        setFormData(emptyForm);
      }
      setFile(null);
      setSaving(false);
    }
  }, [entry, open]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      category: e.target.value,
      subCategory: "", // Reset subcategory
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.note) {
      showNotification("Please fill in all required fields", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const formPayload = new FormData();
      formPayload.append("amount", formData.amount);
      formPayload.append("category", formData.category);
      formPayload.append("subCategory", formData.subCategory);
      formPayload.append("note", formData.note);
      formPayload.append("paymentMethod", formData.paymentMethod);
      formPayload.append("type", formData.type);
      formPayload.append("status", "PENDING");

      if (file) {
        formPayload.append("attachment", file);
      }

      const url = isEditing
        ? `/api/v2/petty-cash/${entry!.id}`
        : "/api/v2/petty-cash";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formPayload,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save entry");
      }

      showNotification(
        isEditing ? "Entry updated successfully" : "Entry created successfully",
        "success"
      );
      onSave();
      onClose();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(
    (c) => c.name === formData.category
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                {isEditing ? "Edit Entry" : "Create Entry"}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {isDisabled && (
                <div className="bg-blue-50 text-blue-800 text-xs font-bold uppercase p-3 rounded-sm border border-blue-100">
                  This entry has been approved and cannot be edited.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={saving || isDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={saving || isDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    disabled={saving || isDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                  >
                    <option value="">Select Category...</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Sub Category
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    disabled={saving || isDisabled || !formData.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                  >
                    <option value="">Select Sub Category...</option>
                    {selectedCategory?.subCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  disabled={saving || isDisabled}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 resize-none"
                  placeholder="Enter a description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    disabled={saving || isDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
                    Attachment
                  </label>
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold uppercase rounded-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50">
                    <IconUpload size={16} className="mr-2" />
                    {file ? "Change File" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={saving || isDisabled}
                    />
                  </label>
                  {file && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {file.name}
                    </p>
                  )}
                  {isEditing && entry?.attachment && !file && (
                    <a
                      href={entry.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                    >
                      View current attachment
                    </a>
                  )}
                </div>
              </div>
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
                disabled={saving || isDisabled}
                className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <IconLoader size={18} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Entry"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PettyCashFormModal;

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconLoader,
  IconUpload,
  IconCurrencyDollar,
  IconCategory,
  IconFileText,
  IconPaperclip,
  IconBuildingBank,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import axios from "axios";

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
  bankAccountId: "",
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
  fileButton:
    "flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black",
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

  // Dropdown data
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(
    []
  );
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; label: string }[]
  >([]);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  const isEditing = !!entry;
  const isDisabled = isEditing && entry?.status === "APPROVED";

  useEffect(() => {
    if (open) {
      fetchDropdowns();

      if (entry) {
        setFormData({
          amount: String(entry.amount),
          category: entry.category || "",
          subCategory: entry.subCategory || "",
          note: entry.note || "",
          paymentMethod: entry.paymentMethod || "cash",
          type: entry.type || "expense",
          bankAccountId: entry.bankAccountId || "",
        });
      } else {
        setFormData(emptyForm);
      }
      setFile(null);
      setSaving(false);
    }
  }, [entry, open]);

  const fetchDropdowns = async () => {
    setFetchingDropdowns(true);
    try {
      const token = await getToken();
      const [catsRes, banksRes] = await Promise.all([
        axios.get("/api/v2/finance/expense-categories?dropdown=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/v2/finance/bank-accounts?dropdown=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setCategories(catsRes.data);
      setBankAccounts(banksRes.data);
    } catch (error) {
      console.error("Error fetching dropdowns", error);
    } finally {
      setFetchingDropdowns(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.note) {
      showNotification("MISSING REQUIRED FIELDS", "warning");
      return;
    }

    if (formData.paymentMethod === "transfer" && !formData.bankAccountId) {
      showNotification("PLEASE SELECT BANK ACCOUNT", "warning");
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
      if (formData.bankAccountId) {
        formPayload.append("bankAccountId", formData.bankAccountId);
        const bank = bankAccounts.find((b) => b.id === formData.bankAccountId);
        if (bank) formPayload.append("bankAccountName", bank.label);
      }
      formPayload.append("type", formData.type);

      // If creating new, set status PENDING. If editing, keep existing or reset?
      // Usually reset to PENDING if changing critical info, but existing logic forced PENDING
      if (!isEditing) {
        formPayload.append("status", "PENDING");
      }

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
        isEditing ? "ENTRY UPDATED" : "ENTRY CREATED",
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
            className="bg-white w-full max-w-2xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-6 md:px-8 border-b-2 border-black flex justify-between items-center shrink-0 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Finance Management
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                  {isEditing ? "Edit Entry" : "New Entry"}
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
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white">
              {isDisabled && (
                <div className="bg-black text-white text-xs font-bold uppercase tracking-widest p-4 border border-black flex items-center justify-center">
                  LOCKED: Entry Approved
                </div>
              )}

              {/* Amount & Type Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={styles.label}>
                    <IconCurrencyDollar size={14} className="inline mr-1" />
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      disabled={saving || isDisabled}
                      className="block w-full bg-black text-white text-3xl font-black px-4 py-4 rounded-sm outline-none placeholder:text-gray-600"
                      placeholder="0.00"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase tracking-widest pointer-events-none">
                      LKR
                    </span>
                  </div>
                </div>

                <div>
                  <label className={styles.label}>Transaction Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={saving || isDisabled}
                    className={`${styles.select} h-[72px] text-lg font-bold`}
                  >
                    <option value="expense">EXPENSE</option>
                    <option value="income">INCOME</option>
                  </select>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className={styles.sectionTitle}>
                  <span className="bg-black text-white p-1 mr-2">
                    <IconCategory size={14} />
                  </span>
                  Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={styles.label}>
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={saving || isDisabled || fetchingDropdowns}
                      className={styles.select}
                    >
                      <option value="">
                        {fetchingDropdowns ? "LOADING..." : "SELECT..."}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.label}>
                          {cat.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>Sub Category</label>
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      placeholder="OPTIONAL"
                      disabled={saving || isDisabled}
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Details & Payment */}
              <div>
                <h3 className={styles.sectionTitle}>
                  <span className="bg-black text-white p-1 mr-2">
                    <IconFileText size={14} />
                  </span>
                  Details
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className={styles.label}>
                      Note / Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      disabled={saving || isDisabled}
                      rows={3}
                      className={styles.input}
                      placeholder="ENTER DETAILS..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={styles.label}>Payment Method</label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        disabled={saving || isDisabled}
                        className={styles.select}
                      >
                        <option value="cash">CASH</option>
                        <option value="card">CARD / ONLINE</option>
                        <option value="transfer">BANK TRANSFER</option>
                      </select>
                    </div>

                    {(formData.paymentMethod === "transfer" ||
                      formData.paymentMethod === "card") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className={styles.label}>
                          <IconBuildingBank size={14} className="inline mr-1" />
                          Bank Account <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="bankAccountId"
                          value={formData.bankAccountId}
                          onChange={handleChange}
                          disabled={saving || isDisabled || fetchingDropdowns}
                          className={styles.select}
                        >
                          <option value="">SELECT BANK...</option>
                          {bankAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.label}
                            </option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    <div>
                      <label className={styles.label}>Attachment</label>
                      <label className={styles.fileButton}>
                        <IconUpload size={16} className="mr-2" />
                        {file ? "CHANGE FILE" : "UPLOAD PROOF"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={saving || isDisabled}
                        />
                      </label>

                      {/* File Feedback */}
                      {file && (
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-black uppercase">
                          <IconPaperclip size={14} />
                          <span className="truncate">{file.name}</span>
                        </div>
                      )}
                      {isEditing && entry?.attachment && !file && (
                        <a
                          href={entry.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline mt-2 uppercase tracking-wide"
                        >
                          <IconPaperclip size={12} /> View Current
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white p-6 md:p-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 z-10">
              <button
                onClick={onClose}
                disabled={saving}
                className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || isDisabled}
                className="w-full sm:flex-[2] py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <IconLoader size={18} className="animate-spin" />
                    PROCESSING
                  </>
                ) : isEditing ? (
                  "SAVE CHANGES"
                ) : (
                  "CREATE ENTRY"
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

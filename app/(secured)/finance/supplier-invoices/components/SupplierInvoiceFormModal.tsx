"use client";
import React, { useState, useEffect } from "react";
import {
  IconX,
  IconLoader2,
  IconUpload,
  IconCalendar,
  IconFileText,
  IconPaperclip,
  IconBuildingStore,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import axios from "axios";

interface SupplierInvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  invoice: SupplierInvoice | null; // null = create
}

const emptyForm = {
  invoiceNumber: "",
  supplierId: "",
  supplierName: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  amount: "",
  paidAmount: "0",
  currency: "LKR",
  notes: "",
  status: "PENDING",
};

const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  fileButton:
    "flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black",
};

const SupplierInvoiceFormModal: React.FC<SupplierInvoiceFormModalProps> = ({
  open,
  onClose,
  onSave,
  invoice,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      if (invoice) {
        setFormData({
          invoiceNumber: invoice.invoiceNumber,
          supplierId: invoice.supplierId,
          supplierName: invoice.supplierName,
          issueDate:
            typeof invoice.issueDate === "string"
              ? invoice.issueDate.split("T")[0]
              : new Date((invoice.issueDate as any).seconds * 1000)
                  .toISOString()
                  .split("T")[0],
          dueDate:
            typeof invoice.dueDate === "string"
              ? invoice.dueDate.split("T")[0]
              : new Date((invoice.dueDate as any).seconds * 1000)
                  .toISOString()
                  .split("T")[0],
          amount: String(invoice.amount),
          paidAmount: String(invoice.paidAmount),
          currency: invoice.currency,
          notes: invoice.notes || "",
          status: invoice.status,
        });
      } else {
        setFormData({
          ...emptyForm,
          issueDate: new Date().toISOString().split("T")[0],
        });
      }
      setFile(null);
    }
  }, [open, invoice]);

  const fetchSuppliers = async () => {
    setFetchingSuppliers(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming api returns array of Supplier objects
      setSuppliers(
        res.data
          .filter((s: any) => s.status === "active")
          .map((s: any) => ({ id: s.id, name: s.name }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingSuppliers(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updates: any = { [name]: value };
      if (name === "supplierId") {
        const sup = suppliers.find((s) => s.id === value);
        if (sup) updates.supplierName = sup.name;
      }
      return { ...prev, ...updates };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.invoiceNumber ||
      !formData.supplierId ||
      !formData.amount ||
      !formData.dueDate
    ) {
      showNotification("Missing required fields", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value);
      });
      if (file) {
        formPayload.append("attachment", file);
      }

      const url = invoice
        ? `/api/v2/finance/supplier-invoices/${invoice.id}`
        : "/api/v2/finance/supplier-invoices";
      const method = invoice ? "PUT" : "POST";

      await axios({
        method,
        url,
        data: formPayload,
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification(
        invoice ? "Invoice updated" : "Invoice created",
        "success"
      );
      onSave();
      onClose();
    } catch (error: any) {
      console.error(error);
      showNotification(
        error.response?.data?.message || "Operation failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            {invoice ? "Edit Invoice" : "New Supplier Invoice"}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Supplier & Invoice No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={styles.label}>
                Supplier <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={saving || !!invoice}
                >
                  <option value="">
                    {fetchingSuppliers ? "Loading..." : "Select Supplier"}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <IconBuildingStore
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className={styles.label}>
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className={styles.input}
                placeholder="INV-001"
                disabled={saving}
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={styles.label}>
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`${styles.input} text-xl font-bold`}
                  placeholder="0.00"
                  disabled={saving}
                />
                <IconCurrencyDollar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className={styles.label}>Paid Amount</label>
              <div className="relative">
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="0.00"
                  disabled={saving}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  LKR
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={styles.label}>Issue Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={saving}
                />
                <IconCalendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className={styles.label}>
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={saving}
                />
                <IconCalendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Notes & Attachment */}
          <div>
            <label className={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={styles.input}
              placeholder="Payment terms, item details..."
              disabled={saving}
            />
          </div>

          <div>
            <label className={styles.label}>Attachment</label>
            <label className={styles.fileButton}>
              <IconUpload size={16} className="mr-2" />
              {file ? "Change File" : "Upload Invoice PDF/Image"}
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={saving}
              />
            </label>
            {file && (
              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-black uppercase">
                <IconPaperclip size={14} />
                <span className="truncate">{file.name}</span>
              </div>
            )}
            {invoice?.attachment && !file && (
              <a
                href={invoice.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline mt-2 uppercase tracking-wide"
              >
                <IconPaperclip size={12} /> View Current
              </a>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <IconLoader2 size={14} className="animate-spin" />}
            {invoice ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierInvoiceFormModal;

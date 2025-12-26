"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCalendar,
  IconFileInvoice,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import SupplierInvoiceFormModal from "./components/SupplierInvoiceFormModal";
import SupplierPaymentModal from "./components/SupplierPaymentModal";

const SupplierInvoicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [summary, setSummary] = useState({
    overdue: 0,
    due7Days: 0,
    totalPayable: 0,
    count: 0,
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(
    null
  );
  const [paymentInvoice, setPaymentInvoice] = useState<SupplierInvoice | null>(
    null
  );

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [listRes, summaryRes] = await Promise.all([
        axios.get<SupplierInvoice[]>("/api/v2/finance/supplier-invoices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/v2/finance/supplier-invoices?summary=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setInvoices(listRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchInvoices();
  }, [currentUser]);

  const handleCreate = () => {
    setEditingInvoice(null);
    setShowModal(true);
  };

  const handleEdit = (inv: SupplierInvoice) => {
    setEditingInvoice(inv);
    setShowModal(true);
  };

  const handlePay = (inv: SupplierInvoice) => {
    setPaymentInvoice(inv);
    setShowPaymentModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const token = await getToken();
      await axios.delete(`/api/v2/finance/supplier-invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Invoice deleted", "success");
      fetchInvoices();
    } catch (error) {
      showNotification("Failed to delete", "error");
    }
  };

  const formatCurrency = (amount: number) => `Rs ${amount.toLocaleString()}`;
  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Accounts Payable">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              Supplier Invoices
            </h2>
            <p className="text-sm text-gray-500">Manage accounts payable</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 flex items-center gap-2"
          >
            <IconPlus size={16} /> New Invoice
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black text-white p-6">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <IconAlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Overdue
              </span>
            </div>
            <p className="text-3xl font-black">
              {formatCurrency(summary.overdue)}
            </p>
            <p className="text-xs text-red-400 mt-1 font-bold">
              Requires Immediate Attention
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <IconClock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Due in 7 Days
              </span>
            </div>
            <p className="text-3xl font-black">
              {formatCurrency(summary.due7Days)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <IconFileInvoice size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Total Payable
              </span>
            </div>
            <p className="text-3xl font-black">
              {formatCurrency(summary.totalPayable)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {summary.count} Unpaid Invoices
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <IconSearch
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search Invoice # or Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:outline-none focus:border-black"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <ComponentsLoader />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Invoice Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-center">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        {inv.supplierName}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Issued: {formatDate(inv.issueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : inv.status === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : inv.status === "PARTIAL"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatCurrency(inv.balance)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div
                        className={`flex items-center justify-center gap-1 ${
                          new Date(inv.dueDate as any).getTime() < Date.now() &&
                          inv.balance > 0
                            ? "text-red-600 font-bold"
                            : "text-gray-600"
                        }`}
                      >
                        <IconCalendar size={14} />
                        {formatDate(inv.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handlePay(inv)}
                            className="px-2 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded flex items-center gap-1"
                            title="Record Payment"
                          >
                            PAY
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-1.5 hover:bg-gray-200 rounded"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id!)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No invoices found.
              </div>
            )}
          </div>
        )}

        <SupplierInvoiceFormModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={fetchInvoices}
          invoice={editingInvoice}
        />

        <SupplierPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={fetchInvoices}
          invoice={paymentInvoice}
        />
      </div>
    </PageContainer>
  );
};

export default SupplierInvoicesPage;

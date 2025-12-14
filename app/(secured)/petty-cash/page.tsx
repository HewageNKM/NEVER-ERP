"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconEye,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFilter,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { getToken } from "@/firebase/firebaseClient";
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import PettyCashFormModal from "./components/PettyCashFormModal";
import PettyCashViewModal from "./components/PettyCashViewModal";
import PageContainer from "../components/container/PageContainer";

export default function PettyCashList() {
  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PettyCash | null>(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    if (currentUser) fetchPettyCash();
  }, [page, currentUser, appliedFilters]);

  const fetchPettyCash = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      let url = `/api/v2/petty-cash?page=${page}&size=10`;

      if (appliedFilters.search)
        url += `&search=${encodeURIComponent(appliedFilters.search)}`;
      if (appliedFilters.status !== "ALL")
        url += `&status=${appliedFilters.status}`;
      if (appliedFilters.type !== "ALL") url += `&type=${appliedFilters.type}`;
      if (appliedFilters.category !== "ALL")
        url += `&category=${encodeURIComponent(appliedFilters.category)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setPettyCashList(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (error) {
      console.error("Failed to fetch petty cash list", error);
      showNotification("Failed to fetch entries", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleClear = () => {
    const defaults = {
      search: "",
      status: "ALL",
      type: "ALL",
      category: "ALL",
    };
    setFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "Delete Entry",
      message: "Are you sure you want to delete this petty cash entry?",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await fetch(`/api/v2/petty-cash/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Entry deleted successfully", "success");
          fetchPettyCash();
        } catch (error) {
          console.error("Failed to delete entry", error);
          showNotification("Failed to delete entry", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // Modal handlers
  const handleOpenCreate = () => {
    setSelectedEntry(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setFormModalOpen(true);
  };

  const handleOpenView = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setSelectedEntry(null);
  };

  return (
    <PageContainer title="Petty Cash" description="Petty Cash Management">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Petty Cash
          </h2>
          <button
            onClick={handleOpenCreate}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm"
          >
            <IconPlus size={18} className="mr-2" />
            Create New
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="w-full md:w-auto flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by Note..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              />
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="ALL">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="ALL">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <IconFilter size={16} className="mr-2" />
                Filter
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <IconX size={16} className="mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <IconLoader
              className="animate-spin mx-auto text-gray-400"
              size={32}
            />
            <p className="mt-2 text-gray-500 text-sm font-bold uppercase">
              Loading entries...
            </p>
          </div>
        ) : pettyCashList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-sm">
            <p className="text-sm font-bold uppercase">No entries found.</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Note</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pettyCashList.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="p-4 font-mono font-bold text-gray-900">
                        Rs. {entry.amount?.toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-700">{entry.category}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            entry.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type === "income" ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">
                        {entry.note}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            entry.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : entry.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(entry.createdAt as string).toLocaleString()}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenView(entry)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                          title="View"
                        >
                          <IconEye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          disabled={entry.status === "APPROVED"}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <IconPencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id!)}
                          disabled={
                            entry.status === "APPROVED" ||
                            deletingId === entry.id
                          }
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {deletingId === entry.id ? (
                            <IconLoader size={18} className="animate-spin" />
                          ) : (
                            <IconTrash size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <IconChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-gray-700 px-4">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <IconChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <PettyCashFormModal
        open={formModalOpen}
        onClose={handleModalClose}
        onSave={fetchPettyCash}
        entry={selectedEntry}
      />

      <PettyCashViewModal
        open={viewModalOpen}
        onClose={handleModalClose}
        onStatusChange={fetchPettyCash}
        entry={selectedEntry}
      />
    </PageContainer>
  );
}

"use client";
import React, { useState, useEffect } from "react";
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
  IconWallet,
  IconSearch,
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
import PageContainer from "../../components/container/PageContainer";

// --- STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  filterButton:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all",
  clearButton:
    "flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-gray-500 text-xs font-black uppercase tracking-widest hover:border-black hover:text-black transition-all bg-white",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
};

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
      title: "DELETE ENTRY?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await fetch(`/api/v2/petty-cash/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("ENTRY DELETED", "success");
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

  // Helper for Status Badges
  const renderStatus = (status: string) => {
    const map = {
      APPROVED: "bg-black text-white border-black",
      PENDING: "bg-white text-black border-black border-2",
      REJECTED: "bg-white text-gray-400 border-gray-200 line-through",
    };
    const style = map[status as keyof typeof map] || map.PENDING;
    return (
      <span
        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${style}`}
      >
        {status}
      </span>
    );
  };

  return (
    <PageContainer title="Petty Cash" description="Manage Expenses">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
              Financial Records
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Petty Cash
            </h2>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all group"
          >
            <IconPlus
              size={18}
              className="mr-2 group-hover:rotate-90 transition-transform"
            />
            Create Entry
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-4">
              <label className={styles.label}>Search Notes</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="SEARCH..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFilter();
                  }}
                  className={styles.input}
                />
                <IconSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className={styles.label}>Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className={styles.select}
              >
                <option value="ALL">ALL STATUS</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* Type */}
            <div className="md:col-span-2">
              <label className={styles.label}>Type</label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className={styles.select}
              >
                <option value="ALL">ALL TYPES</option>
                <option value="expense">EXPENSE</option>
                <option value="income">INCOME</option>
              </select>
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className={styles.label}>Category</label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className={styles.select}
              >
                <option value="ALL">ALL CATS</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading}
                className={`${styles.filterButton} w-full`}
              >
                <IconFilter size={16} />
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className={`${styles.clearButton} w-full`}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <IconLoader className="animate-spin text-black mb-3" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Loading Records...
            </p>
          </div>
        ) : pettyCashList.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center">
            <IconWallet className="text-gray-300 mb-4" size={48} />
            <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
              No Entries Found
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                <tr>
                  <th className="p-6">Details</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pettyCashList.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-6 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900 leading-tight line-clamp-2 max-w-[250px]">
                          {entry.note || "NO NOTE"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(
                            entry.createdAt as string
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            entry.type === "income"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="font-black text-lg font-mono tracking-tight">
                          {Number(entry.amount).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1">
                        {entry.category}
                      </span>
                    </td>
                    <td className="p-6 align-top">
                      {renderStatus(entry.status)}
                    </td>
                    <td className="p-6 align-top text-right">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => handleOpenView(entry)}
                          className={styles.iconBtn}
                          title="View"
                        >
                          <IconEye size={16} stroke={2} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          disabled={entry.status === "APPROVED"}
                          className={styles.iconBtn}
                          title="Edit"
                        >
                          <IconPencil size={16} stroke={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id!)}
                          disabled={
                            entry.status === "APPROVED" ||
                            deletingId === entry.id
                          }
                          className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                          title="Delete"
                        >
                          {deletingId === entry.id ? (
                            <IconLoader size={16} className="animate-spin" />
                          ) : (
                            <IconTrash size={16} stroke={2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={styles.iconBtn + " w-10 h-10"}
              >
                <IconChevronLeft size={18} />
              </button>
              <div className="px-6 font-black text-sm tracking-widest">
                PAGE {page} <span className="text-gray-400">/</span>{" "}
                {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={styles.iconBtn + " w-10 h-10"}
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
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

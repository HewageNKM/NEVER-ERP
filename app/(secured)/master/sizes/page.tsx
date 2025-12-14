"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconLoader,
  IconChevronLeft,
  IconChevronRight,
  IconRuler,
} from "@tabler/icons-react";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Size } from "@/model/Size";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
};

const SizePage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [form, setForm] = useState({
    name: "",
    status: true,
  });

  // Fetch Sizes
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const token = await getToken();
      const { data } = await axios({
        method: "GET",
        url: "/api/v2/master/sizes",
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSizes(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch sizes", e);
      showNotification("Failed to fetch sizes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchSizes();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      setForm({ name: size.name, status: size.status });
    } else {
      setEditingSize(null);
      setForm({ name: "", status: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification("Size name is required", "warning");
      return;
    }
    try {
      setSaving(true);
      const token = await getToken();

      if (editingSize) {
        await axios({
          method: "PUT",
          url: `/api/v2/master/sizes/${editingSize.id}`,
          data: form,
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios({
          method: "POST",
          url: "/api/v2/master/sizes",
          data: form,
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchSizes();
      setOpen(false);
      showNotification(editingSize ? "SIZE UPDATED" : "SIZE ADDED", "success");
    } catch (e) {
      console.error("Failed to save size", e);
      showNotification("Failed to save size", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE SIZE?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios({
            method: "DELETE",
            url: `/api/v2/master/sizes/${id}`,
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchSizes();
          showNotification("Size deleted successfully", "success");
        } catch (e) {
          console.error("Failed to delete size", e);
          showNotification("Failed to delete size", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSizes();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchSizes, 0);
  };

  const renderStatus = (status: boolean) => {
    return (
      <span
        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
          status
            ? "bg-black text-white border-black"
            : "bg-white text-gray-400 border-gray-200"
        }`}
      >
        {status ? "ACTIVE" : "INACTIVE"}
      </span>
    );
  };

  return (
    <PageContainer title="Sizes" description="Size Management">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconRuler size={14} /> Product Attributes
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Size Chart
            </h2>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            disabled={saving}
            className="flex items-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
          >
            {saving ? (
              <IconLoader className="animate-spin mr-2" size={18} />
            ) : (
              <IconPlus size={18} className="mr-2" />
            )}
            New Size
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className={styles.label}>Search</label>
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="SEARCH SIZES..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className={styles.label}>Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "all" | "active" | "inactive")
                }
                className={styles.select}
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="inactive">INACTIVE</option>
              </select>
            </div>

            <div className="md:col-span-3 flex gap-2">
              <button
                onClick={handleFilterSearch}
                disabled={loading}
                className={`${styles.primaryBtn} w-full`}
              >
                {loading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <IconSearch size={16} />
                )}
              </button>
              <button
                onClick={handleClearFilters}
                disabled={loading}
                className={`${styles.secondaryBtn} w-full`}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <IconLoader className="animate-spin text-black mb-3" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Loading Data
              </p>
            </div>
          ) : sizes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 m-4">
              <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                No Sizes Found
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                    <tr>
                      <th className="p-6">Size Name</th>
                      <th className="p-6 text-center">Status</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sizes.map((size) => (
                      <tr
                        key={size.id}
                        className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-6 font-black text-black uppercase tracking-wide text-lg">
                          {size.name}
                        </td>
                        <td className="p-6 text-center">
                          {renderStatus(size.status)}
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => handleOpenDialog(size)}
                              className={styles.iconBtn}
                              title="Edit"
                            >
                              <IconEdit size={16} stroke={2} />
                            </button>
                            <button
                              onClick={() => handleDelete(size.id!)}
                              disabled={deletingId === size.id}
                              className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                              title="Delete"
                            >
                              {deletingId === size.id ? (
                                <IconLoader
                                  size={16}
                                  className="animate-spin"
                                />
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

              {/* Pagination */}
              <div className="flex justify-center p-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className={styles.iconBtn}
                  >
                    <IconChevronLeft size={18} />
                  </button>

                  <div className="px-6 font-black text-sm tracking-widest uppercase">
                    PAGE {pagination.page}
                  </div>

                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(
                          Math.ceil(pagination.total / pagination.size),
                          prev.page + 1
                        ),
                      }))
                    }
                    disabled={
                      pagination.page >=
                      Math.ceil(pagination.total / pagination.size)
                    }
                    className={styles.iconBtn}
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="bg-white w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-between items-center p-6 border-b-2 border-black">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                    Size Entry
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                    {editingSize ? "Edit Size" : "New Size"}
                  </h2>
                </div>
                <button
                  onClick={saving ? undefined : () => setOpen(false)}
                  disabled={saving}
                  className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
                >
                  <IconX
                    size={20}
                    className="text-black group-hover:text-white transition-colors"
                  />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <label className={styles.label}>
                    Size Name (e.g. XL, 42, 10.5)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    className={styles.input}
                    placeholder="ENTER SIZE..."
                    autoFocus
                  />
                </div>

                {/* Custom Checkbox */}
                <label className="group flex items-center gap-4 cursor-pointer p-4 border-2 border-transparent bg-[#f5f5f5] hover:border-gray-200 transition-colors">
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                      form.status
                        ? "bg-black border-black"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {form.status && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.checked })
                    }
                    disabled={saving}
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-black uppercase tracking-wide">
                      Active Status
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Available for products
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white">
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-black border border-transparent hover:border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={styles.primaryBtn}
                >
                  {saving ? (
                    <>
                      <IconLoader size={16} className="animate-spin mr-2" />
                      Saving
                    </>
                  ) : (
                    "Save Size"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default SizePage;

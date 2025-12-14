"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconUpload,
  IconLoader,
  IconChevronLeft,
  IconChevronRight,
  IconAward,
  IconPhoto,
} from "@tabler/icons-react";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Brand } from "@/model/Brand";
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

const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { showConfirmation } = useConfirmationDialog();

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
    logoFile: null as File | null,
    logoUrl: "",
  });

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await axios.get("/api/v1/master/brands", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setBrands(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch brands", e);
      showNotification("Failed to fetch brands", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchBrands();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({
        name: brand.name,
        description: brand.description || "",
        status: brand.status,
        logoFile: null,
        logoUrl: brand.logoUrl || "",
      });
    } else {
      setEditingBrand(null);
      setForm({
        name: "",
        description: "",
        status: true,
        logoFile: null,
        logoUrl: "",
      });
    }
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, logoFile: file }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification("Brand name is required", "warning");
      return;
    }
    try {
      setSaving(true);
      const token = await getToken();

      if (form.logoFile) {
        if (form.logoFile.size > 1024 * 1024) {
          showNotification("Logo file size must be less than 1MB", "error");
          return;
        }
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("status", String(form.status));
      if (form.logoFile) formData.append("logo", form.logoFile);

      if (editingBrand) {
        await axios.put(`/api/v1/master/brands/${editingBrand.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/v1/master/brands", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      showNotification(
        editingBrand ? "BRAND UPDATED" : "BRAND ADDED",
        "success"
      );
      await fetchBrands();
      setOpen(false);
    } catch (e) {
      console.error("Failed to save brand", e);
      showNotification("Failed to save brand", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE BRAND?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios.delete(`/api/v1/master/brands/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Brand deleted successfully", "success");
          await fetchBrands();
        } catch (e) {
          console.error("Failed to delete brand", e);
          showNotification("Failed to delete brand", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchBrands, 0);
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBrands();
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
    <PageContainer title="Brands" description="Brand Management">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconAward size={14} /> Partner Relationships
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Brand Management
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
            New Brand
          </button>
        </div>

        {/* Filters */}
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
                  placeholder="SEARCH BRANDS..."
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
                Loading Brands
              </p>
            </div>
          ) : brands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 m-4">
              <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                No Brands Found
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                    <tr>
                      <th className="p-6">Identity</th>
                      <th className="p-6">Brand Name</th>
                      <th className="p-6">Description</th>
                      <th className="p-6 text-center">Status</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {brands.map((brand) => (
                      <tr
                        key={brand.id}
                        className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-6 align-middle">
                          <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center overflow-hidden border border-gray-200 relative group-hover:border-black transition-colors">
                            {brand.logoUrl ? (
                              <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                              />
                            ) : (
                              <IconPhoto size={20} className="text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="p-6 align-middle font-black text-black uppercase tracking-wide text-base">
                          {brand.name}
                        </td>
                        <td className="p-6 align-middle text-xs text-gray-500 max-w-xs truncate">
                          {brand.description || "NO DESCRIPTION"}
                        </td>
                        <td className="p-6 align-middle text-center">
                          {renderStatus(brand.status)}
                        </td>
                        <td className="p-6 align-middle text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => handleOpenDialog(brand)}
                              className={styles.iconBtn}
                              title="Edit"
                            >
                              <IconEdit size={16} stroke={2} />
                            </button>
                            <button
                              onClick={() => handleDelete(brand.id)}
                              disabled={deletingId === brand.id}
                              className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                              title="Delete"
                            >
                              {deletingId === brand.id ? (
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
                  <span className="text-xs font-black text-black px-4 uppercase tracking-widest">
                    Page {pagination.page}
                  </span>
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

      {/* --- ADD/EDIT MODAL --- */}
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
                    Form Entry
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                    {editingBrand ? "Edit Brand" : "New Brand"}
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
                  <label className={styles.label}>Brand Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    className={styles.input}
                    placeholder="ENTER NAME..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className={styles.label}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    disabled={saving}
                    className={`${styles.input} min-h-[100px]`}
                    placeholder="ENTER DETAILS..."
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
                      Visible in filters
                    </span>
                  </div>
                </label>

                {/* Custom File Upload */}
                <div>
                  <label className={styles.label}>Brand Logo</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-xs font-bold uppercase tracking-wide hover:bg-black hover:text-white hover:border-black transition-all">
                      <IconUpload size={16} className="mr-2" /> Select File
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        disabled={saving}
                      />
                    </label>
                    <div className="flex-1">
                      {form.logoUrl && !form.logoFile ? (
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>{" "}
                          Current Logo Active
                        </div>
                      ) : form.logoFile ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Selected
                          </span>
                          <span className="text-xs font-bold text-black truncate">
                            {form.logoFile.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No file selected
                        </span>
                      )}
                    </div>
                    {(form.logoUrl || form.logoFile) && (
                      <div className="w-10 h-10 border border-gray-200 bg-gray-50 p-1">
                        <img
                          src={
                            form.logoFile
                              ? URL.createObjectURL(form.logoFile)
                              : form.logoUrl
                          }
                          alt="Preview"
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                    )}
                  </div>
                </div>
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
                      Processing
                    </>
                  ) : (
                    "Save Brand"
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

export default BrandPage;

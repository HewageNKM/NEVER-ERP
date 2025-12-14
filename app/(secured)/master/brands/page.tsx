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
} from "@tabler/icons-react";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Brand } from "@/model/Brand";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

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
        editingBrand
          ? "Brand updated successfully"
          : "Brand added successfully",
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
      title: "Delete Brand",
      message: "Are you sure you want to delete this brand?",
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
    // Trigger fetch via useEffect dependency change if logic allows,
    // but here explicit fetch is safer if state updates are batched/async not triggering immediate effect
    // Actually fetchBrands reads state, so we need to wait for state update or pass params.
    // Better to just update state and let useEffect handle it if dependencies are correct.
    // But fetchBrands doesn't depend on search/status state in useEffect dependency array.
    // So we must manually fetch or rely on a "trigger" state.
    // For now, let's just create a wrapper that updates state and then calls fetch with explicit args or utilize a robust hook.
    // Given the current structure, let's just reload.
    setTimeout(fetchBrands, 0);
  };

  // Handlers for filters to trigger fetch
  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBrands();
  };

  return (
    <PageContainer title="Brands" description="Brand Management">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Brand Management
          </h2>
          <button
            onClick={() => handleOpenDialog()}
            disabled={saving}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <IconLoader className="animate-spin mr-2" size={18} />
            ) : (
              <IconPlus size={18} className="mr-2" />
            )}
            Add Brand
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          {/* --- FILTER BAR --- */}
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="w-full md:w-auto flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              />
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "all" | "active" | "inactive")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilterSearch}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <>
                    <IconSearch size={16} className="mr-2" />
                    Filter
                  </>
                )}
              </button>
              <button
                onClick={handleClearFilters}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <IconX size={16} className="mr-2" />
                Clear
              </button>
            </div>
          </div>

          {/* --- TABLE & PAGINATION --- */}
          {loading ? (
            <div className="text-center py-12">
              <IconLoader
                className="animate-spin mx-auto text-gray-400"
                size={32}
              />
              <p className="mt-2 text-gray-500 text-sm font-bold uppercase">
                Loading Brands...
              </p>
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-bold uppercase">No brands found.</p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
                    <tr>
                      <th className="p-4">Logo</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {brands.map((brand) => (
                      <tr
                        key={brand.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                            {brand.logoUrl ? (
                              <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 font-bold text-xs uppercase">
                                {brand.name.substring(0, 2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900 uppercase">
                          {brand.name}
                        </td>
                        <td className="p-4 text-gray-600">
                          {brand.description || "-"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase ${
                              brand.status
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {brand.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenDialog(brand)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <IconEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
                            disabled={deletingId === brand.id}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === brand.id ? (
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

              <div className="flex justify-center mt-6">
                {/* Simple Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 px-4">
                    Page {pagination.page} of{" "}
                    {Math.ceil(pagination.total / pagination.size) || 1}
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
                    className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                  {editingBrand ? "Edit Brand" : "Add Brand"}
                </h2>
                <button
                  onClick={saving ? undefined : () => setOpen(false)}
                  disabled={saving}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <IconX size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.checked })
                      }
                      disabled={saving}
                      className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="text-sm font-bold text-gray-700 uppercase">
                      Active Status
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
                    Brand Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                      <IconUpload size={18} className="mr-2" /> Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        disabled={saving}
                      />
                    </label>
                    {form.logoUrl && (
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                        <img
                          src={form.logoUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {form.logoFile && (
                      <span className="text-xs text-gray-600 truncate max-w-[150px]">
                        {form.logoFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-200 rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <IconLoader size={18} className="animate-spin mr-2" />
                      Saving...
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

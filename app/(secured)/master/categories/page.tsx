"use client";

import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconLoader,
  IconChevronLeft,
  IconChevronRight,
  IconUpload,
} from "@tabler/icons-react";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Category } from "@/model/Category";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
  });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
    imageFile: null as File | null,
    imageUrl: "",
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await axios({
        method: "GET",
        url: "/api/v2/master/categories", // Updated to v2
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch categories", e);
      showNotification("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchCategories();
  }, [pagination.page, pagination.size, currentUser]);

  // Open Add/Edit Dialog
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setForm({
        name: category.name,
        description: category.description || "",
        status: category.status,
        imageFile: null,
        imageUrl: (category as any).image || "", // Type cast if model isn't updated yet
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: "",
        description: "",
        status: true,
        imageFile: null,
        imageUrl: "",
      });
    }
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, imageFile: file }));
  };

  // Save (Add/Edit)
  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification("Category name is required", "warning");
      return;
    }

    try {
      setSaving(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("status", String(form.status));
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      if (editingCategory) {
        await axios.put(
          `/api/v2/master/categories/${editingCategory.id}`, // Updated to v2
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("/api/v2/master/categories", formData, {
          // Updated to v2
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchCategories();
      setOpen(false);
      showNotification(
        editingCategory
          ? "Category updated successfully"
          : "Category added successfully",
        "success"
      );
    } catch (e) {
      console.error("Failed to save category", e);
      const message = e.response?.data?.message || "Failed to save category";
      showNotification(message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete
  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "Delete Category",
      message: "Are you sure you want to delete this category?",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios.delete(`/api/v2/master/categories/${id}`, {
            // Updated to v2
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchCategories();
          showNotification("Category deleted successfully", "success");
        } catch (e) {
          console.error("Failed to delete category", e);
          showNotification("Failed to delete category", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCategories();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchCategories, 0);
  };

  return (
    <PageContainer title="Categories" description="Category Management">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Category Management
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
            Add Category
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
                placeholder="Search categories..."
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

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <IconLoader
                className="animate-spin mx-auto text-gray-400"
                size={32}
              />
              <p className="mt-2 text-gray-500 text-sm font-bold uppercase">
                Loading Categories...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-bold uppercase">
                No categories found.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
                    <tr>
                      <th className="p-4">Image</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                            {(cat as any).image ? (
                              <img
                                src={(cat as any).image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 font-bold text-xs uppercase">
                                {cat.name.substring(0, 2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900 uppercase">
                          {cat.name}
                        </td>
                        <td className="p-4 text-gray-600">
                          {cat.description || "-"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase ${
                              cat.status
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {cat.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenDialog(cat)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <IconEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id!)}
                            disabled={deletingId === cat.id}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === cat.id ? (
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                {editingCategory ? "Edit Category" : "Add Category"}
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
              <div className="flex flex-col items-center">
                <label className="block text-sm font-bold text-gray-700 uppercase mb-2 w-full">
                  Category Image
                </label>
                <label className="cursor-pointer relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center overflow-hidden bg-gray-50 group">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={saving}
                  />
                  {form.imageFile ? (
                    <img
                      src={URL.createObjectURL(form.imageFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Current"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600">
                      <IconUpload size={24} />
                      <span className="text-xs font-bold uppercase mt-1">
                        Upload
                      </span>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Name
                </label>
                <inputfixed
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
                  "Save Category"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CategoryPage;

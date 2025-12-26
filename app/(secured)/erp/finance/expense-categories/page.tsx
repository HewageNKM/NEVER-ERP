"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconCategory,
  IconSearch,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  type: "expense" | "income";
  status: boolean;
}

const ExpenseCategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all"
  );

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "expense" as "expense" | "income",
    status: true,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const url =
        typeFilter === "all"
          ? "/api/v2/finance/expense-categories"
          : `/api/v2/finance/expense-categories?type=${typeFilter}`;

      const res = await axios.get<ExpenseCategory[]>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchCategories();
  }, [currentUser, typeFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", type: "expense", status: true });
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
      status: category.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showNotification("Please enter a category name", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();

      if (editingId) {
        await axios.put(
          `/api/v2/finance/expense-categories/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Category updated", "success");
      } else {
        await axios.post("/api/v2/finance/expense-categories", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Category created", "success");
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      showNotification("Failed to save category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = await getToken();
      await axios.delete(`/api/v2/finance/expense-categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Category deleted", "success");
      fetchCategories();
    } catch (error) {
      console.error(error);
      showNotification("Failed to delete category", "error");
    }
  };

  return (
    <PageContainer title="Expense Categories">
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Expense Categories
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage expense and income categories
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="w-full md:w-auto px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 flex items-center justify-center gap-2"
          >
            <IconPlus size={14} />
            Add Category
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "expense", "income"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                typeFilter === type
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <IconCategory size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">Name</th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">Type</th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {cat.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase ${
                            cat.type === "expense"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase ${
                            cat.status
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cat.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cat.description || "No description"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase ${
                            cat.type === "expense"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {cat.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase ${
                            cat.status
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cat.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {editingId ? "Edit Category" : "Add Category"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Office Supplies"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="status" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <IconLoader2 size={14} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ExpenseCategoriesPage;

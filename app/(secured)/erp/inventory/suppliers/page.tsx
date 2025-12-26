"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLoader2,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  paymentTerms?: string;
  notes?: string;
  status: "active" | "inactive";
}

const DEFAULT_SUPPLIER: Supplier = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  paymentTerms: "COD",
  notes: "",
  status: "active",
};

const SuppliersPage = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Supplier>(DEFAULT_SUPPLIER);
  const [saving, setSaving] = useState(false);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<Supplier[]>("/api/v2/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSuppliers();
  }, [currentUser]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData(DEFAULT_SUPPLIER);
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showNotification("Supplier name is required", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();

      if (editingSupplier?.id) {
        await axios.put(`/api/v2/suppliers/${editingSupplier.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Supplier updated", "success");
      } else {
        await axios.post("/api/v2/suppliers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Supplier created", "success");
      }

      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      showNotification("Failed to save supplier", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;

    try {
      const token = await getToken();
      await axios.delete(`/api/v2/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Supplier deactivated", "success");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      showNotification("Failed to delete supplier", "error");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
  );

  return (
    <PageContainer title="Suppliers">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Suppliers
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your suppliers and vendors
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            Add Supplier
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-black"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">Name</th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Payment Terms
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.city && (
                          <div className="text-xs text-gray-500">
                            {supplier.city}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.contactPerson || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.paymentTerms || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase ${
                            supplier.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id!)}
                            className="p-2 hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No suppliers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  {editingSupplier ? "Edit Supplier" : "Add Supplier"}
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
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms || "COD"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    >
                      <option value="COD">Cash on Delivery</option>
                      <option value="Advance">Advance Payment</option>
                      <option value="Net 7">Net 7 Days</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <IconLoader2 size={14} className="animate-spin" />}
                  {editingSupplier ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SuppliersPage;

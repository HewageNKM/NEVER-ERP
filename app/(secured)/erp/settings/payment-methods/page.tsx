"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader,
  IconX,
  IconCreditCard,
  IconPercentage,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { showNotification } from "@/utils/toast";
import { PaymentMethod } from "@/model/PaymentMethod";
import { auth } from "@/firebase/firebaseClient";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md disabled:opacity-50",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
};

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    fee: "0",
    status: true,
    description: "",
    paymentId: "",
    available: ["Store"],
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/v2/payment-methods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out deleted if API doesn't already (though API doesn't filter in GET right now, better strictly filter here or update API)
        // API returns all docs. Let's filter client side for safety if API missed it
        const validData = data.filter((m: any) => !m.isDeleted);
        setMethods(validData);
      } else {
        showNotification("Failed to fetch payment methods", "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Error fetching methods", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchMethods();
    }
  }, [auth.currentUser]);

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setForm({
        name: method.name,
        fee: String(method.fee),
        status: method.status,
        description: method.description || "",
        paymentId: method.paymentId || "",
        available: method.available || ["Store"],
      });
    } else {
      setEditingMethod(null);
      setForm({
        name: "",
        fee: "0",
        status: true,
        description: "",
        paymentId: "",
        available: ["Store"],
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    // --- Validation ---
    if (!form.name.trim()) {
      showNotification("Method name is required", "warning");
      return;
    }
    const feeVal = parseFloat(form.fee);
    if (isNaN(feeVal) || feeVal < 0) {
      showNotification("Fee must be a valid non-negative number", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const payload = {
        name: form.name,
        fee: feeVal,
        status: form.status,
        description: form.description,
        paymentId: form.paymentId,
        available: form.available,
      };

      if (editingMethod) {
        const res = await fetch(`/api/v2/payment-methods/${editingMethod.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          showNotification("METHOD UPDATED", "success");
        } else {
          throw new Error("Failed to update");
        }
      } else {
        const res = await fetch("/api/v2/payment-methods", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          showNotification("METHOD CREATED", "success");
        } else {
          throw new Error("Failed to create");
        }
      }
      setOpen(false);
      fetchMethods();
    } catch (error) {
      console.error(error);
      showNotification("Operation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payment method?"))
      return;
    setDeletingId(id);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`/api/v2/payment-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification("METHOD DELETED", "success");
        fetchMethods();
      } else {
        showNotification("Failed to delete method", "error");
      }
    } catch (error) {
      showNotification("Error deleting method", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const renderStatus = (active: boolean) => (
    <span
      className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-gray-400 border-gray-200"
      }`}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );

  return (
    <PageContainer
      title="Payment Methods"
      description="Manage POS Payment Options"
    >
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconCreditCard size={14} /> POS Configuration
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Payment Methods
            </h2>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            disabled={saving}
            className="flex items-center justify-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
          >
            <IconPlus size={18} className="mr-2" />
            New Method
          </button>
        </div>

        {/* Table Area */}
        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <IconLoader className="animate-spin text-black mb-3" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Loading Methods...
              </p>
            </div>
          ) : methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 m-4">
              <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                No Payment Methods
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="p-6">Method Name</th>
                    <th className="p-6">Channels</th>
                    <th className="p-6">Processing Fee</th>
                    <th className="p-6 text-center">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {methods.map((method) => (
                    <tr
                      key={method.id}
                      className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-6 align-middle">
                        <div className="flex flex-col">
                          <span className="font-black text-black uppercase tracking-wide">
                            {method.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            ID: {method.paymentId || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 align-middle">
                        <div className="flex gap-1 flex-wrap">
                          {method.available?.map((ch) => (
                            <span
                              key={ch}
                              className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-600 uppercase border border-gray-200"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 align-middle font-medium text-gray-600">
                        {method.fee > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black">
                              {method.fee}%
                            </span>
                            <span className="text-[10px] uppercase text-gray-400">
                              Fee Applied
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold uppercase">
                            No Fee
                          </span>
                        )}
                      </td>
                      <td className="p-6 align-middle text-center">
                        {renderStatus(method.status)}
                      </td>
                      <td className="p-6 align-middle text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => handleOpenDialog(method)}
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <IconEdit size={16} stroke={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(method.id!)} // ID should exist from DB
                            disabled={deletingId === method.id}
                            className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                            title="Delete"
                          >
                            {deletingId === method.id ? (
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
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="bg-white w-full max-w-md shadow-2xl flex flex-col border border-gray-200 max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-between items-center p-6 border-b-2 border-black sticky top-0 bg-white z-10">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                    Configuration
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                    {editingMethod ? "Edit Method" : "New Method"}
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="group flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
                >
                  <IconX
                    size={20}
                    className="text-black group-hover:text-white transition-colors"
                  />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div>
                  <label className={styles.label}>
                    Method Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    className={styles.input}
                    placeholder="e.g. VISAMASTER"
                    autoFocus
                  />
                </div>

                <div>
                  <label className={styles.label}>
                    Payment ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.paymentId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentId: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={saving || !!editingMethod}
                    className={`${styles.input} uppercase ${
                      editingMethod ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    placeholder="e.g. PM-001"
                  />
                </div>

                <div>
                  <label className={styles.label}>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    disabled={saving}
                    className={styles.input}
                    placeholder="Brief description of the payment method..."
                  />
                </div>

                <div>
                  <label className={styles.label}>Available Channels</label>
                  <div className="flex gap-4">
                    {["Store", "Website"].map((channel) => (
                      <label
                        key={channel}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form.available.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  available: [...form.available, channel],
                                });
                              } else {
                                setForm({
                                  ...form,
                                  available: form.available.filter(
                                    (c) => c !== channel
                                  ),
                                });
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 border-2 border-gray-300 bg-white peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center">
                            {/* Checkmark icon or just fill? Using fill dot for now to match other style or maybe IconCheck */}
                            <div className="w-2 h-2 bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                          {channel}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    Processing Fee (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.fee}
                      onChange={(e) =>
                        setForm({ ...form, fee: e.target.value })
                      }
                      className={styles.input}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    <IconPercentage
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-wide">
                    Percentage added to order total
                  </p>
                </div>

                {/* Status Toggle - Changed to Switch Style */}
                <div className="p-4 bg-gray-50 border border-gray-200">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-black uppercase tracking-wide mb-1">
                        Active Status
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-tight">
                        Method visible in POS
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                    </div>
                  </label>
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
                      Saving...
                    </>
                  ) : (
                    "Save Method"
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

export default PaymentMethodsPage;

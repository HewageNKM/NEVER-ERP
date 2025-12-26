"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader,
  IconX,
  IconTruckDelivery,
  IconWeight,
  IconCalculator,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { showNotification } from "@/utils/toast";
import { ShippingRule } from "@/model/ShippingRule";

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

const ShippingSettingsPage = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    minWeight: "0",
    maxWeight: "0",
    rate: "0",
    isActive: true,
    // Incremental
    isIncremental: false,
    baseWeight: "1",
    perKgRate: "0",
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/shipping-rules");
      if (res.ok) {
        const data = await res.json();
        data.sort(
          (a: ShippingRule, b: ShippingRule) => a.minWeight - b.minWeight
        );
        setRules(data);
      } else {
        showNotification("Failed to fetch shipping rules", "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Error fetching rules", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenDialog = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        minWeight: String(rule.minWeight),
        maxWeight: String(rule.maxWeight),
        rate: String(rule.rate),
        isActive: rule.isActive,
        isIncremental: rule.isIncremental || false,
        baseWeight: String(rule.baseWeight || 1),
        perKgRate: String(rule.perKgRate || 0),
      });
    } else {
      setEditingRule(null);
      setForm({
        name: "",
        minWeight: "0",
        maxWeight: "0",
        rate: "0",
        isActive: true,
        isIncremental: false,
        baseWeight: "1",
        perKgRate: "0",
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    // --- Validation ---
    if (!form.name.trim()) {
      showNotification("Rule name is required", "warning");
      return;
    }
    if (parseFloat(form.minWeight) < 0 || parseFloat(form.maxWeight) <= 0) {
      showNotification("Valid weight range is required", "warning");
      return;
    }
    if (parseFloat(form.rate) < 0) {
      showNotification("Rate cannot be negative", "warning");
      return;
    }

    // specific validation for incremental
    if (form.isIncremental) {
      if (!form.baseWeight || parseFloat(form.baseWeight) <= 0) {
        showNotification(
          "Base Weight Limit is required for incremental rules",
          "warning"
        );
        return;
      }
      if (!form.perKgRate || parseFloat(form.perKgRate) < 0) {
        showNotification(
          "Per Kg Rate is required for incremental rules",
          "warning"
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        minWeight: parseFloat(form.minWeight),
        maxWeight: parseFloat(form.maxWeight),
        rate: parseFloat(form.rate),
        isActive: form.isActive,
        isIncremental: form.isIncremental,
        baseWeight: form.isIncremental
          ? parseFloat(form.baseWeight)
          : undefined,
        perKgRate: form.isIncremental ? parseFloat(form.perKgRate) : undefined,
      };

      if (editingRule) {
        const res = await fetch(`/api/v1/shipping-rules/${editingRule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          showNotification("RULE UPDATED", "success");
        } else {
          throw new Error("Failed to update");
        }
      } else {
        const res = await fetch("/api/v1/shipping-rules", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          showNotification("RULE CREATED", "success");
        } else {
          throw new Error("Failed to create");
        }
      }
      setOpen(false);
      fetchRules();
    } catch (error) {
      console.error(error);
      showNotification("Operation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/shipping-rules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("RULE DELETED", "success");
        fetchRules();
      } else {
        showNotification("Failed to delete rule", "error");
      }
    } catch (error) {
      showNotification("Error deleting rule", "error");
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
    <PageContainer title="Shipping" description="Manage Dynamic Shipping Rates">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconTruckDelivery size={14} /> Logistics Configuration
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Shipping Rates
            </h2>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            disabled={saving}
            className="flex items-center justify-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
          >
            <IconPlus size={18} className="mr-2" />
            New Rule
          </button>
        </div>

        {/* Table Area */}
        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <IconLoader className="animate-spin text-black mb-3" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Loading Rules...
              </p>
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 m-4">
              <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                No Active Rules
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="p-6">Rule Name</th>
                    <th className="p-6">Calculation</th>
                    <th className="p-6">Rates</th>
                    <th className="p-6 text-center">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-6 align-middle font-black text-black uppercase tracking-wide">
                        {rule.name}
                      </td>
                      <td className="p-6 align-middle font-medium text-gray-600">
                        {rule.isIncremental ? (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-wide">
                              <IconCalculator size={14} /> Incremental
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              {rule.minWeight}kg - {rule.maxWeight}kg
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                              <IconWeight size={14} /> Flat Rate
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              {rule.minWeight}kg - {rule.maxWeight}kg
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-6 align-middle">
                        {rule.isIncremental ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-black">
                              Base: Rs. {rule.rate}{" "}
                              <span className="text-gray-400 text-[10px] font-bold uppercase">
                                (UP TO {rule.baseWeight}kg)
                              </span>
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              + Rs. {rule.perKgRate}/kg{" "}
                              <span className="text-gray-400 text-[9px] uppercase">
                                (EXTRA)
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold font-mono text-black">
                            Rs. {rule.rate.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="p-6 align-middle text-center">
                        {renderStatus(rule.isActive)}
                      </td>
                      <td className="p-6 align-middle text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => handleOpenDialog(rule)}
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <IconEdit size={16} stroke={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            disabled={deletingId === rule.id}
                            className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                            title="Delete"
                          >
                            {deletingId === rule.id ? (
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
              className="bg-white w-full max-w-md shadow-2xl flex flex-col border border-gray-200 max-h-[90vh] overflow-y-auto"
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
                    {editingRule ? "Edit Rule" : "New Rule"}
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

              <div className="p-8 space-y-6">
                <div>
                  <label className={styles.label}>
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    className={styles.input}
                    placeholder="e.g. STANDARD DELIVERY"
                    autoFocus
                  />
                </div>

                {/* Logic Toggle */}
                <div className="p-4 bg-gray-50 border border-gray-200">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-black uppercase tracking-wide mb-1">
                        Incremental Calculation?
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-tight">
                        Enable "Base + Per Kg" logic
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.isIncremental}
                        onChange={(e) =>
                          setForm({ ...form, isIncremental: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={styles.label}>
                      Min Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.minWeight}
                      onChange={(e) =>
                        setForm({ ...form, minWeight: e.target.value })
                      }
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={styles.label}>
                      Max Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.maxWeight}
                      onChange={(e) =>
                        setForm({ ...form, maxWeight: e.target.value })
                      }
                      className={styles.input}
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    {form.isIncremental ? "Base Rate (LKR)" : "Flat Rate (LKR)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className={styles.input}
                    placeholder="350"
                  />
                </div>

                {/* Incremental Fields */}
                <AnimatePresence>
                  {form.isIncremental && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-[#f0f0f0] border-l-4 border-black p-4 space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className={styles.label}>
                          Base Weight Limit (kg){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.baseWeight}
                          onChange={(e) =>
                            setForm({ ...form, baseWeight: e.target.value })
                          }
                          className="block w-full bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-sm border border-gray-200 outline-none focus:border-black transition-colors"
                          placeholder="1.0"
                        />
                        <p className="text-[9px] text-gray-500 mt-1 font-bold uppercase">
                          Weight covered by base rate
                        </p>
                      </div>
                      <div>
                        <label className={styles.label}>
                          Extra Cost Per Kg (LKR){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.perKgRate}
                          onChange={(e) =>
                            setForm({ ...form, perKgRate: e.target.value })
                          }
                          className="block w-full bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-sm border border-gray-200 outline-none focus:border-black transition-colors"
                          placeholder="80"
                        />
                        <p className="text-[9px] text-gray-500 mt-1 font-bold uppercase">
                          Added for every 1kg above limit
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Toggle */}
                <label className="group flex items-center gap-4 cursor-pointer p-4 border-2 border-transparent bg-[#f5f5f5] hover:border-gray-200 transition-colors">
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                      form.isActive
                        ? "bg-black border-black"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {form.isActive && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-black uppercase tracking-wide">
                      Active Status
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Rule will apply at checkout
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
                      Saving...
                    </>
                  ) : (
                    "Save Rule"
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

export default ShippingSettingsPage;

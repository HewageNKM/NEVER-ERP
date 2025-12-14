"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconLoader,
  IconDeviceFloppy,
  IconSettings,
  IconServer,
  IconWorld,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { getToken } from "@/firebase/firebaseClient";

interface Stock {
  id: string;
  label: string;
}

interface Settings {
  defaultStockId: string;
  onlineStockId: string;
  ecommerce: {
    enable: boolean;
  };
  pos: {
    enable: boolean;
  };
  [key: string]: any;
}

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-bold px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-2",
  card: "bg-white border border-gray-200 p-8 shadow-sm",
  toggleContainer:
    "flex items-center justify-between p-6 border-2 border-transparent bg-[#f5f5f5] hover:border-gray-300 transition-all",
  toggleLabel: "text-sm font-black text-black uppercase tracking-wide",
  toggleSub:
    "text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1",
};

const SettingPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const [settingsRes, stocksRes] = await Promise.all([
        fetch("/api/v2/settings/erp", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/v2/master/stocks/dropdown", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!settingsRes.ok) throw new Error("Failed to fetch settings");
      if (!stocksRes.ok) throw new Error("Failed to fetch stocks");

      const settingsData = await settingsRes.json();
      const stocksData = await stocksRes.json();

      setSettings(settingsData);
      setStocks(stocksData);
    } catch (err: any) {
      showNotification(err.message || "Failed to fetch settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleNestedChange = (section: string, key: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, [section]: { ...prev[section], [key]: value } } : prev
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const token = await getToken();
      const res = await fetch("/api/v2/settings/erp", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      showNotification("CONFIGURATION SAVED", "success");
    } catch (err: any) {
      showNotification(err.message || "FAILED TO SAVE", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Settings" description="Settings Management">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <IconLoader className="animate-spin text-black mb-4" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Loading Configuration...
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Settings Management">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconSettings size={14} /> System Configuration
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              ERP Settings
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
          >
            {saving ? (
              <IconLoader className="animate-spin mr-2" size={16} />
            ) : (
              <IconDeviceFloppy size={16} className="mr-2" />
            )}
            {saving ? "Processing" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Source Configuration */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <IconServer size={20} stroke={2} /> Inventory Source
            </h3>
            <div className="space-y-6">
              {/* Default Stock */}
              <div>
                <label className={styles.label}>Default Warehouse</label>
                <div className="relative">
                  <select
                    value={settings?.defaultStockId || ""}
                    onChange={(e) =>
                      handleChange("defaultStockId", e.target.value)
                    }
                    className={styles.select}
                  >
                    <option value="">SELECT LOCATION...</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
                  Primary source for general operations.
                </p>
              </div>

              {/* Online Stock */}
              <div>
                <label className={styles.label}>Online Allocation</label>
                <div className="relative">
                  <select
                    value={settings?.onlineStockId || ""}
                    onChange={(e) =>
                      handleChange("onlineStockId", e.target.value)
                    }
                    className={styles.select}
                  >
                    <option value="">SELECT LOCATION...</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
                  Inventory reserved for digital channels.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <IconDeviceDesktop size={20} stroke={2} /> Platform Modules
            </h3>

            <div className="space-y-4">
              {/* Website Toggle */}
              <div className={styles.toggleContainer}>
                <div>
                  <div className="flex items-center gap-2">
                    <IconWorld size={18} className="text-gray-500" />
                    <h4 className={styles.toggleLabel}>E-Commerce</h4>
                  </div>
                  <p className={styles.toggleSub}>Public Storefront Access</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.ecommerce?.enable || false}
                    onChange={(e) =>
                      handleNestedChange(
                        "ecommerce",
                        "enable",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  {/* Sharp Industrial Switch */}
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              {/* POS Toggle */}
              <div className={styles.toggleContainer}>
                <div>
                  <div className="flex items-center gap-2">
                    <IconDeviceDesktop size={18} className="text-gray-500" />
                    <h4 className={styles.toggleLabel}>Point of Sale</h4>
                  </div>
                  <p className={styles.toggleSub}>Internal Sales Interface</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.pos?.enable || false}
                    onChange={(e) =>
                      handleNestedChange("pos", "enable", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  {/* Sharp Industrial Switch */}
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingPage;

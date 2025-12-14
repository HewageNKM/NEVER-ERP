"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconLoader,
  IconDeviceFloppy,
  IconSettings,
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
      showNotification("Settings saved successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Settings" description="Settings Management">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <IconLoader className="animate-spin text-gray-400 mb-2" size={32} />
          <p className="text-sm font-bold uppercase text-gray-500">
            Loading Settings...
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Settings Management">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 text-white rounded-sm">
              <IconSettings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
                ERP Settings
              </h2>
              <p className="text-sm text-gray-500 uppercase font-bold">
                Configuration for POS and Website
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <IconLoader className="animate-spin mr-2" size={18} />
            ) : (
              <IconDeviceFloppy size={18} className="mr-2" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-8">
          <h3 className="text-lg font-bold uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100">
            General Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Default Stock */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
                Default Stock Location
              </label>
              <div className="relative">
                <select
                  value={settings?.defaultStockId || ""}
                  onChange={(e) =>
                    handleChange("defaultStockId", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors bg-white appearance-none"
                >
                  <option value="">Select Stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                Primary inventory source for general operations.
              </p>
            </div>

            {/* Online Stock */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
                Online Stock Location
              </label>
              <div className="relative">
                <select
                  value={settings?.onlineStockId || ""}
                  onChange={(e) =>
                    handleChange("onlineStockId", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors bg-white appearance-none"
                >
                  <option value="">Select Stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                Inventory source allocated for e-commerce orders.
              </p>
            </div>

            <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2"></div>

            {/* Website Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-sm">
              <div>
                <h4 className="text-sm font-bold uppercase text-gray-900">
                  Website E-commerce
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Enable or disable the public facing online store.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.ecommerce?.enable || false}
                  onChange={(e) =>
                    handleNestedChange("ecommerce", "enable", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            {/* POS Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-sm">
              <div>
                <h4 className="text-sm font-bold uppercase text-gray-900">
                  Point of Sale (POS)
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Enable access to the POS sales interface.
                </p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingPage;

"use client";

import React, { useState, useEffect } from "react";
import {
  IconReceipt2,
  IconDeviceFloppy,
  IconLoader2,
  IconInfoCircle,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface TaxSettings {
  id?: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxIncludedInPrice: boolean;
  applyToShipping: boolean;
  taxRegistrationNumber?: string;
  businessName?: string;
  minimumOrderForTax?: number;
}

const TaxSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>({
    taxEnabled: false,
    taxName: "VAT",
    taxRate: 0,
    taxIncludedInPrice: true,
    applyToShipping: false,
    taxRegistrationNumber: "",
    businessName: "",
    minimumOrderForTax: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<TaxSettings>("/api/v2/settings/tax", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch tax settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.put("/api/v2/settings/tax", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Tax settings saved successfully", "success");
    } catch (error) {
      console.error(error);
      showNotification("Failed to save tax settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof TaxSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate example tax
  const examplePrice = 10000;
  const calculateExampleTax = () => {
    if (!settings.taxEnabled || settings.taxRate <= 0) return 0;
    if (settings.taxIncludedInPrice) {
      return examplePrice - examplePrice / (1 + settings.taxRate / 100);
    }
    return (examplePrice * settings.taxRate) / 100;
  };

  if (loading) {
    return (
      <PageContainer title="Tax Settings">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tax Settings">
      <div className="w-full space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Tax Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Configure tax rates and calculation rules for your business.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : (
              <IconDeviceFloppy size={16} />
            )}
            Save Settings
          </button>
        </div>

        {/* Main Toggle */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 flex items-center justify-center ${
                  settings.taxEnabled ? "bg-black" : "bg-gray-100"
                }`}
              >
                <IconReceipt2
                  size={24}
                  className={
                    settings.taxEnabled ? "text-white" : "text-gray-400"
                  }
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  Enable Tax Collection
                </h3>
                <p className="text-sm text-gray-500">
                  Turn on to calculate and track tax on orders
                </p>
              </div>
            </div>
            <button
              onClick={() => handleChange("taxEnabled", !settings.taxEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.taxEnabled ? "bg-black" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.taxEnabled ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tax Configuration */}
        {settings.taxEnabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Basic Settings */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Tax Rate
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={settings.taxName}
                      onChange={(e) => handleChange("taxName", e.target.value)}
                      placeholder="e.g., VAT, GST, Sales Tax"
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.taxRate}
                      onChange={(e) =>
                        handleChange("taxRate", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <IconInfoCircle
                      size={16}
                      className="text-gray-400 mt-0.5"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Calculation Preview
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    For an order of{" "}
                    <strong>Rs {examplePrice.toLocaleString()}</strong>:
                    <br />
                    {settings.taxName} ({settings.taxRate}%) ={" "}
                    <strong className="text-black">
                      Rs {calculateExampleTax().toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Calculation Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Tax Included in Prices
                    </h4>
                    <p className="text-sm text-gray-500">
                      Product prices already include tax (common in retail)
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange(
                        "taxIncludedInPrice",
                        !settings.taxIncludedInPrice
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.taxIncludedInPrice ? "bg-black" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.taxIncludedInPrice
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Apply Tax to Shipping
                    </h4>
                    <p className="text-sm text-gray-500">
                      Include shipping fees in taxable amount
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleChange("applyToShipping", !settings.applyToShipping)
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.applyToShipping ? "bg-black" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.applyToShipping
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="p-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Minimum Order for Tax (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.minimumOrderForTax || 0}
                    onChange={(e) =>
                      handleChange(
                        "minimumOrderForTax",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0 = Apply to all orders"
                    className="w-full max-w-xs px-4 py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Only apply tax to orders above this amount. Set to 0 to
                    apply to all.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Business Information (Optional)
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName || ""}
                      onChange={(e) =>
                        handleChange("businessName", e.target.value)
                      }
                      placeholder="Your business name"
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Tax Registration Number
                    </label>
                    <input
                      type="text"
                      value={settings.taxRegistrationNumber || ""}
                      onChange={(e) =>
                        handleChange("taxRegistrationNumber", e.target.value)
                      }
                      placeholder="e.g., VAT-123456789"
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxSettingsPage;

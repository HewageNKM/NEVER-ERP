"use client";

import React, { useState, useEffect } from "react";
import {
  IconReceipt2,
  IconDeviceFloppy,
  IconLoader2,
  IconInfoCircle,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
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

// Toggle Switch Component
const Toggle = ({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) => {
  const isSmall = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative inline-flex shrink-0 cursor-pointer items-center
        rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
        ${checked ? "bg-black" : "bg-gray-300"}
        ${isSmall ? "h-6 w-11" : "h-7 w-14"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block transform rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${
            checked
              ? isSmall
                ? "translate-x-5"
                : "translate-x-7"
              : "translate-x-0.5"
          }
          ${isSmall ? "h-5 w-5" : "h-6 w-6"}
        `}
      />
    </button>
  );
};

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
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Tax Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Configure tax rates and calculation rules.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 ${
                  settings.taxEnabled ? "bg-black" : "bg-gray-100"
                }`}
              >
                <IconReceipt2
                  size={20}
                  className={
                    settings.taxEnabled ? "text-white" : "text-gray-400"
                  }
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Enable Tax Collection
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Calculate and track tax on orders
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.taxEnabled}
              onChange={() => handleChange("taxEnabled", !settings.taxEnabled)}
            />
          </div>
        </div>

        {/* Tax Configuration */}
        {settings.taxEnabled && (
          <div className="space-y-6">
            {/* Tax Rate Section */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">
                  Tax Rate
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={settings.taxName}
                      onChange={(e) => handleChange("taxName", e.target.value)}
                      placeholder="e.g., VAT, GST"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <IconInfoCircle
                      size={16}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Calculation Preview
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    For Rs {examplePrice.toLocaleString()}:{" "}
                    <strong className="text-black">
                      {settings.taxName} = Rs {calculateExampleTax().toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">
                  Calculation Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {/* Tax Included Toggle */}
                <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                      Tax Included in Prices
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Prices already include tax
                    </p>
                  </div>
                  <Toggle
                    checked={settings.taxIncludedInPrice}
                    onChange={() =>
                      handleChange(
                        "taxIncludedInPrice",
                        !settings.taxIncludedInPrice
                      )
                    }
                    size="sm"
                  />
                </div>

                {/* Apply to Shipping Toggle */}
                <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                      Apply Tax to Shipping
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Include shipping in taxable amount
                    </p>
                  </div>
                  <Toggle
                    checked={settings.applyToShipping}
                    onChange={() =>
                      handleChange("applyToShipping", !settings.applyToShipping)
                    }
                    size="sm"
                  />
                </div>

                {/* Minimum Order */}
                <div className="p-4 sm:p-6">
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
                    placeholder="0"
                    className="w-full sm:max-w-xs px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Set to 0 to apply to all orders
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">
                  Business Information
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm sm:text-base"
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

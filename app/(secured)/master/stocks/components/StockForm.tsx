"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StockLocation } from "@/model/StockLocation";
import { IconLoader, IconX } from "@tabler/icons-react";

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    locationData: Omit<StockLocation, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  location: StockLocation | null;
}

const emptyLocation: Omit<
  StockLocation,
  "id" | "createdAt" | "updatedAt" | "isDeleted"
> = {
  name: "",
  address: "",
  status: true,
};

const StockFormModal: React.FC<LocationFormModalProps> = ({
  open,
  onClose,
  onSave,
  location,
}) => {
  const [formData, setFormData] = useState(emptyLocation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!location;

  useEffect(() => {
    if (open) {
      if (location) {
        setFormData({
          name: location.name,
          address: location.address || "",
          status: location.status,
        });
      } else {
        setFormData(emptyLocation);
      }
      setSaving(false);
      setError(null);
    }
  }, [location, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, status: !prev.status }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Location name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      // Parent handles closing
    } catch (error) {
      console.error("Save failed in modal");
      setError("Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-md rounded-sm shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
                {isEditing ? "Edit Stock Location" : "Add Stock Location"}
              </h2>
              <button
                onClick={saving ? undefined : onClose}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <IconX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-bold uppercase p-3 rounded-sm border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
                  placeholder="E.g. Main Warehouse"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address (Optional)
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={saving}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 resize-none"
                  placeholder="Enter full address..."
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <label className="text-sm font-bold text-gray-900 uppercase">
                  Active Status
                </label>
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                    formData.status ? "bg-gray-900" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-5 py-2 text-sm font-bold text-gray-600 uppercase hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && (
                  <IconLoader size={16} className="animate-spin mr-2" />
                )}
                {saving ? "Saving..." : "Save Location"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StockFormModal;

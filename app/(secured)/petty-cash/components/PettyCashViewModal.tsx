"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconLoader,
  IconCheck,
  IconBan,
  IconExternalLink,
  IconCalendar,
  IconUser,
  IconCreditCard,
  IconCategory,
  IconFileText,
  IconDownload,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";

interface PettyCashViewModalProps {
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  entry: PettyCash | null;
}

const PettyCashViewModal: React.FC<PettyCashViewModalProps> = ({
  open,
  onClose,
  onStatusChange,
  entry,
}) => {
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(
    null
  );

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!entry) return;

    setProcessing(newStatus === "APPROVED" ? "approve" : "reject");
    try {
      const token = await getToken();
      const res = await fetch(`/api/v2/petty-cash/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }

      showNotification(
        `Entry ${newStatus.toLowerCase()} successfully`,
        "success"
      );
      onStatusChange();
      onClose();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string | any) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  if (!entry) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                  Entry Details
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase mt-2 ${
                    entry.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : entry.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              <button
                onClick={onClose}
                disabled={!!processing}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <IconX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Amount & Type */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-sm border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Amount
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    Rs. {entry.amount?.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-sm text-sm font-bold uppercase ${
                    entry.type === "income"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {entry.type === "income" ? "Income" : "Expense"}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconCategory size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Category
                    </p>
                    <p className="text-sm text-gray-900">
                      {entry.category}
                      {entry.subCategory && ` → ${entry.subCategory}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IconFileText size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Note
                    </p>
                    <p className="text-sm text-gray-900">{entry.note || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IconCreditCard size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Payment Method
                    </p>
                    <p className="text-sm text-gray-900 capitalize">
                      {entry.paymentMethod}
                    </p>
                  </div>
                </div>

                {entry.attachment && (
                  <div className="flex items-start gap-3">
                    <IconExternalLink
                      size={18}
                      className="text-gray-400 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Attachment
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={entry.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:underline"
                        >
                          <IconExternalLink size={14} className="mr-1" />
                          View
                        </a>
                        <a
                          href={entry.attachment}
                          download
                          className="inline-flex items-center text-sm text-green-600 hover:underline"
                        >
                          <IconDownload size={14} className="mr-1" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Metadata
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <IconUser size={14} className="text-gray-400" />
                    <span className="text-gray-500">Created By:</span>
                    <span className="text-gray-900 font-medium truncate">
                      {entry.createdBy || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IconCalendar size={14} className="text-gray-400" />
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  {entry.reviewedBy && (
                    <>
                      <div className="flex items-center gap-2">
                        <IconUser size={14} className="text-gray-400" />
                        <span className="text-gray-500">Reviewed By:</span>
                        <span className="text-gray-900 font-medium truncate">
                          {entry.reviewedBy}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconCalendar size={14} className="text-gray-400" />
                        <span className="text-gray-500">Reviewed:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(entry.reviewedAt)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-3">
              <button
                onClick={onClose}
                disabled={!!processing}
                className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-200 rounded-sm transition-colors"
              >
                Close
              </button>

              {entry.status === "PENDING" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate("REJECTED")}
                    disabled={!!processing}
                    className="px-6 py-2 bg-red-600 text-white text-sm font-bold uppercase rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {processing === "reject" ? (
                      <IconLoader size={18} className="animate-spin mr-2" />
                    ) : (
                      <IconBan size={18} className="mr-2" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={!!processing}
                    className="px-6 py-2 bg-green-600 text-white text-sm font-bold uppercase rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {processing === "approve" ? (
                      <IconLoader size={18} className="animate-spin mr-2" />
                    ) : (
                      <IconCheck size={18} className="mr-2" />
                    )}
                    Approve
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PettyCashViewModal;

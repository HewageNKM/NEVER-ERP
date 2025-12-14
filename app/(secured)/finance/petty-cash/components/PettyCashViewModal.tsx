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
  IconPaperclip,
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

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1",
  value: "text-sm font-bold text-black uppercase tracking-wide",
  sectionBox: "p-4 border border-gray-100 bg-white",
  modalContainer:
    "bg-white w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200",
  actionBtn:
    "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2",
};

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

      showNotification(`ENTRY ${newStatus}`, "success");
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
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatus = (status: string) => {
    const map = {
      APPROVED: "bg-black text-white border-black",
      PENDING: "bg-white text-black border-black border-2",
      REJECTED: "bg-gray-100 text-gray-400 border-gray-100 line-through",
    };
    const style = map[status as keyof typeof map] || map.PENDING;
    return (
      <span
        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${style}`}
      >
        {status}
      </span>
    );
  };

  if (!entry) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-white/80 backdrop-blur-md p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex justify-between items-start p-6 md:p-8 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 block">
                  Transaction Details
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                  Record #{entry.id?.slice(-6)}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={!!processing}
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
              >
                <IconX
                  size={20}
                  className="text-black group-hover:text-white transition-colors"
                />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero: Amount */}
              <div className="p-8 bg-gray-50 border-b border-gray-200 text-center relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  {renderStatus(entry.status)}
                </div>
                <span
                  className={`inline-block mb-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                    entry.type === "income"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {entry.type}
                </span>
                <h3 className="text-5xl md:text-6xl font-black text-black tracking-tighter">
                  <span className="text-2xl align-top mr-1 font-bold text-gray-400">
                    LKR
                  </span>
                  {Number(entry.amount).toLocaleString()}
                </h3>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2">
                <div className={`${styles.sectionBox} border-r border-b`}>
                  <div className="flex items-center gap-2 mb-2">
                    <IconCategory size={14} className="text-gray-400" />
                    <span className={styles.label}>Category</span>
                  </div>
                  <p className={styles.value}>{entry.category}</p>
                  {entry.subCategory && (
                    <p className="text-xs text-gray-500 mt-1 uppercase font-medium">
                      {entry.subCategory}
                    </p>
                  )}
                </div>

                <div className={`${styles.sectionBox} border-b`}>
                  <div className="flex items-center gap-2 mb-2">
                    <IconCreditCard size={14} className="text-gray-400" />
                    <span className={styles.label}>Method</span>
                  </div>
                  <p className={styles.value}>{entry.paymentMethod}</p>
                </div>

                <div className="col-span-2 p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <IconFileText size={14} className="text-gray-400" />
                    <span className={styles.label}>Note / Description</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    {entry.note || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Attachment */}
              {entry.attachment && (
                <div className="p-6 bg-blue-50/30 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <IconPaperclip size={14} className="text-gray-400" />
                    <span className={styles.label}>Proof of Transaction</span>
                  </div>
                  <div className="flex gap-4">
                    <a
                      href={entry.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase tracking-wide hover:border-black hover:bg-black hover:text-white transition-all"
                    >
                      <IconExternalLink size={14} /> View File
                    </a>
                    <a
                      href={entry.attachment}
                      download
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase tracking-wide hover:border-black hover:bg-black hover:text-white transition-all"
                    >
                      <IconDownload size={14} /> Download
                    </a>
                  </div>
                </div>
              )}

              {/* Audit Trail - Monospace Look */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h4 className="text-[9px] font-bold text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-black rounded-full"></span> Audit
                  Trail
                </h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase font-mono mb-0.5">
                      Created By
                    </span>
                    <div className="flex items-center gap-2">
                      <IconUser size={12} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-700 font-mono truncate">
                        {entry.createdBy || "System"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase font-mono mb-0.5">
                      Date Created
                    </span>
                    <div className="flex items-center gap-2">
                      <IconCalendar size={12} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-700 font-mono">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                  </div>

                  {entry.reviewedBy && (
                    <>
                      <div>
                        <span className="block text-[9px] text-gray-400 uppercase font-mono mb-0.5">
                          Reviewed By
                        </span>
                        <div className="flex items-center gap-2">
                          <IconCheck size={12} className="text-green-600" />
                          <span className="text-xs font-bold text-gray-700 font-mono truncate">
                            {entry.reviewedBy}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-400 uppercase font-mono mb-0.5">
                          Date Reviewed
                        </span>
                        <div className="flex items-center gap-2">
                          <IconCalendar size={12} className="text-gray-500" />
                          <span className="text-xs font-bold text-gray-700 font-mono">
                            {formatDate(entry.reviewedAt)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex border-t-2 border-black bg-white z-10">
              <button
                onClick={onClose}
                disabled={!!processing}
                className={`${styles.actionBtn} bg-white text-black hover:bg-gray-50`}
              >
                Close
              </button>

              {entry.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("REJECTED")}
                    disabled={!!processing}
                    className={`${styles.actionBtn} bg-red-600 text-white hover:bg-red-700 border-l border-white`}
                  >
                    {processing === "reject" ? (
                      <IconLoader size={16} className="animate-spin" />
                    ) : (
                      <IconBan size={16} />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={!!processing}
                    className={`${styles.actionBtn} bg-black text-white hover:bg-gray-900 border-l border-white`}
                  >
                    {processing === "approve" ? (
                      <IconLoader size={16} className="animate-spin" />
                    ) : (
                      <IconCheck size={16} />
                    )}
                    Approve
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PettyCashViewModal;

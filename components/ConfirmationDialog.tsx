"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface ConfirmationDialogProps {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.15 },
  },
};

const ConfirmationDialog = ({
  title,
  body,
  onConfirm,
  onCancel,
  open,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationDialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmBtn:
            "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
        };
      case "warning":
        return {
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          confirmBtn:
            "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white",
        };
      default:
        return {
          iconBg: "bg-gray-100",
          iconColor: "text-gray-900",
          confirmBtn:
            "bg-gray-900 hover:bg-black focus:ring-gray-500 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-dialog-title"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog Panel */}
          <motion.div
            className="relative bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close dialog"
            >
              <IconX size={20} />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 300,
                  delay: 0.1,
                }}
              >
                <div className={`p-3 rounded-full ${styles.iconBg}`}>
                  <IconAlertTriangle size={28} className={styles.iconColor} />
                </div>
              </motion.div>

              {/* Title */}
              <h2
                id="confirmation-dialog-title"
                className="text-center text-lg font-bold uppercase tracking-wide text-gray-900 mb-2"
              >
                {title}
              </h2>

              {/* Message */}
              <p className="text-center text-sm text-gray-600 leading-relaxed">
                {body}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-4 border-t border-gray-100">
              <motion.button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cancelText}
              </motion.button>
              <motion.button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-sm focus:outline-none focus:ring-2 transition-colors ${styles.confirmBtn}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;

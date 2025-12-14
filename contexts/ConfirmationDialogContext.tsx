"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

type ConfirmationDialogOptions = {
  title?: string;
  message: string;
  onSuccess?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
};

type ConfirmationDialogContextType = {
  showConfirmation: (options: ConfirmationDialogOptions) => void;
};

const ConfirmationDialogContext = createContext<
  ConfirmationDialogContextType | undefined
>(undefined);

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

export const ConfirmationDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [dialog, setDialog] = useState<ConfirmationDialogOptions | null>(null);

  const showConfirmation = (options: ConfirmationDialogOptions) => {
    setDialog(options);
  };

  const handleConfirm = () => {
    dialog?.onSuccess?.();
    setDialog(null);
  };

  const handleClose = () => {
    dialog?.onClose?.();
    setDialog(null);
  };

  const getVariantStyles = () => {
    switch (dialog?.variant) {
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
    <ConfirmationDialogContext.Provider value={{ showConfirmation }}>
      {children}

      <AnimatePresence>
        {dialog && (
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
              onClick={handleClose}
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
                onClick={handleClose}
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
                  {dialog?.title || "Confirm Action"}
                </h2>

                {/* Message */}
                <p className="text-center text-sm text-gray-600 leading-relaxed">
                  {dialog?.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-4 border-t border-gray-100">
                <motion.button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {dialog?.cancelText || "Cancel"}
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-sm focus:outline-none focus:ring-2 transition-colors ${styles.confirmBtn}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {dialog?.confirmText || "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationDialogContext.Provider>
  );
};

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmationDialog must be used within a ConfirmationDialogProvider"
    );
  }
  return context;
};

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconAlertTriangle,
  IconX,
  IconInfoCircle,
  IconBan,
} from "@tabler/icons-react";

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

// Snappy transitions for tech feel
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.1 },
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
          icon: (
            <IconBan size={48} className="text-red-600 mb-4" stroke={1.5} />
          ),
          titleColor: "text-red-600",
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white border-red-600",
        };
      case "warning":
        return {
          icon: (
            <IconAlertTriangle
              size={48}
              className="text-black mb-4"
              stroke={1.5}
            />
          ),
          titleColor: "text-black",
          confirmBtn: "bg-black hover:bg-gray-800 text-white border-black",
        };
      default:
        return {
          icon: (
            <IconInfoCircle
              size={48}
              className="text-black mb-4"
              stroke={1.5}
            />
          ),
          titleColor: "text-black",
          confirmBtn: "bg-black hover:bg-gray-800 text-white border-black",
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
              className="absolute inset-0 bg-white/80 backdrop-blur-md"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dialog Panel - Sharp edges, hard shadow */}
            <motion.div
              className="relative bg-white w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-2 text-black hover:bg-gray-100 transition-colors z-10"
                aria-label="Close dialog"
              >
                <IconX size={20} />
              </button>

              <div className="flex flex-col items-center text-center p-8 pb-6">
                {/* Icon */}
                {styles.icon}

                {/* Title */}
                <h2
                  id="confirmation-dialog-title"
                  className={`text-2xl font-black uppercase tracking-tighter leading-none mb-3 ${styles.titleColor}`}
                >
                  {dialog?.title || "Are you sure?"}
                </h2>

                {/* Message */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed px-4">
                  {dialog?.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex border-t-2 border-black">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-gray-50 transition-colors"
                >
                  {dialog?.cancelText || "Cancel"}
                </button>
                <div className="w-[2px] bg-black"></div>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest transition-colors ${styles.confirmBtn}`}
                >
                  {dialog?.confirmText || "Confirm"}
                </button>
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

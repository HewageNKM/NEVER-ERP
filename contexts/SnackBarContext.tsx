import { createContext, useContext, ReactNode } from "react";
import toast, { Toaster } from "react-hot-toast";

type SnackbarContextType = {
  showNotification: (
    message: string,
    severity?: "success" | "error" | "warning" | "info"
  ) => void;
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const showNotification = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "success"
  ) => {
    const style = {
      border: "1px solid #E5E7EB",
      padding: "12px 16px",
      color: "#111827",
      background: "#FFFFFF",
      borderRadius: "2px", // Nike-like sharp/small radius
      fontWeight: "600",
      fontSize: "0.875rem",
      textTransform: "uppercase" as const,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    };

    const iconTheme = {
      primary: "#111827",
      secondary: "#FFFFFF",
    };

    switch (severity) {
      case "success":
        toast.success(message, {
          style: { ...style, borderLeft: "4px solid #10B981" },
          iconTheme: { primary: "#10B981", secondary: "#FFF" },
        });
        break;
      case "error":
        toast.error(message, {
          style: { ...style, borderLeft: "4px solid #EF4444" },
          iconTheme: { primary: "#EF4444", secondary: "#FFF" },
        });
        break;
      case "warning":
        // toast.custom or standard blank with icon
        toast(message, {
          icon: "⚠️",
          style: { ...style, borderLeft: "4px solid #F59E0B" },
        });
        break;
      case "info":
        toast(message, {
          icon: "ℹ️",
          style: { ...style, borderLeft: "4px solid #3B82F6" },
        });
        break;
      default:
        toast(message, { style });
    }
  };

  return (
    <SnackbarContext.Provider value={{ showNotification }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          // Default options can be set here too
        }}
      />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

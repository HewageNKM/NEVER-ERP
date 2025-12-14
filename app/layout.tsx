"use client";
import "./global.css";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import StoreProvider from "@/components/StoreProvider";
import { ConfirmationDialogProvider } from "@/contexts/ConfirmationDialogContext";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <ConfirmationDialogProvider>
            <ThemeProvider theme={baselightTheme}>
              <CssBaseline />
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    fontFamily: "inherit",
                  },
                }}
              />
            </ThemeProvider>
          </ConfirmationDialogProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

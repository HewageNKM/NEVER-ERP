"use client";
import "./global.css";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import StoreProvider from "@/components/StoreProvider";
import { SnackbarProvider } from "@/contexts/SnackBarContext";
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
          <SnackbarProvider>
            <ConfirmationDialogProvider>
              <ThemeProvider theme={baselightTheme}>
                <CssBaseline />
                {children}
              </ThemeProvider>
            </ConfirmationDialogProvider>
          </SnackbarProvider>
        </StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}

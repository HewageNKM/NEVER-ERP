"use client";

import { Box, CircularProgress } from "@mui/material";
import POSHero from "./POSHero";
import POSProducts from "./POSProducts";
import POSInvoiceDetails from "./POSInvoiceDetails";
import POSPaymentForm from "./POSPaymentForm";
import POSStockDialog from "./POSStockDialog";
import { usePOS } from "../context/POSContext";

export default function POSContent() {
  const { isProductsLoading } = usePOS();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: 2,
        height: "calc(100vh - 120px)",
        width: "100%",
      }}
    >
      {/* Left Panel - Products */}
      <Box
        sx={{
          flex: { xs: 1, lg: 1 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: { xs: "50vh", lg: "auto" },
        }}
      >
        <POSHero />
        {isProductsLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <CircularProgress sx={{ color: "black" }} />
          </Box>
        ) : (
          <POSProducts />
        )}
      </Box>

      {/* Right Panel - Invoice Details */}
      <Box
        sx={{
          flex: { xs: 1, lg: 1 },
          display: "flex",
          flexDirection: "column",
          minHeight: { xs: "50vh", lg: "auto" },
        }}
      >
        <POSInvoiceDetails />
      </Box>

      {/* Dialogs */}
      <POSStockDialog />
      <POSPaymentForm />
    </Box>
  );
}

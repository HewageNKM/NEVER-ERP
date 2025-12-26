"use client";

import React, { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loadStockFromStorage,
  initializeInvoiceId,
  fetchPosCart,
  fetchPosProducts,
} from "@/lib/posSlice/posSlice";
import POSHero from "./components/POSHero";
import POSProducts from "./components/POSProducts";
import POSInvoiceDetails from "./components/POSInvoiceDetails";
import POSPaymentForm from "./components/POSPaymentForm";
import POSStockDialog from "./components/POSStockDialog";

export default function POSPage() {
  const dispatch = useAppDispatch();
  const { selectedStockId, showStockDialog, isProductsLoading } =
    useAppSelector((state) => state.pos);

  // Initialize on mount
  useEffect(() => {
    dispatch(loadStockFromStorage());
    dispatch(initializeInvoiceId());
    dispatch(fetchPosCart());
  }, [dispatch]);

  // Fetch products when stock is selected
  useEffect(() => {
    if (selectedStockId) {
      dispatch(fetchPosProducts(selectedStockId));
    }
  }, [selectedStockId, dispatch]);

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
            <CircularProgress />
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

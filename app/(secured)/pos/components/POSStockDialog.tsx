"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { usePOS } from "../context/POSContext";
import toast from "react-hot-toast";

export default function POSStockDialog() {
  const {
    stocks,
    selectedStockId,
    showStockDialog,
    isStocksLoading,
    loadStocks,
    selectStock,
    loadProducts,
    closeStockDialog,
  } = usePOS();

  // Fetch stocks on mount
  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleConfirm = () => {
    if (!selectedStockId) {
      toast.error("Please select a stock location");
      return;
    }

    // Save to localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem("neverbePOSStockId", selectedStockId);
    }

    // Fetch products for selected stock
    loadProducts(selectedStockId);
    closeStockDialog();
    toast.success("Stock location selected");
  };

  const handleChange = (value: string) => {
    selectStock(value);
  };

  return (
    <Dialog
      open={showStockDialog}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 0, border: "2px solid black" } }}
      // Prevent closing without selection
      onClose={(_, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          closeStockDialog();
        }
      }}
    >
      <DialogTitle
        sx={{ borderBottom: "2px solid", borderColor: "grey.200", pb: 2 }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ textTransform: "uppercase" }}
        >
          Select Stock Location
        </Typography>
        <Typography
          variant="body2"
          color="grey.500"
          fontWeight={600}
          sx={{ mt: 0.5 }}
        >
          Choose the store or warehouse to load inventory from
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {isStocksLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress sx={{ color: "black" }} />
          </Box>
        ) : stocks.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <Typography
              color="text.secondary"
              fontWeight={600}
              sx={{ textTransform: "uppercase" }}
            >
              No stock locations available
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ "&.Mui-focused": { color: "black" } }}>
              STOCK LOCATION
            </InputLabel>
            <Select
              value={selectedStockId || ""}
              label="Stock Location"
              onChange={(e) => handleChange(e.target.value)}
              sx={{
                borderRadius: 0,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                },
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {stocks.map((stock) => (
                <MenuItem
                  key={stock.id}
                  value={stock.id}
                  sx={{ fontWeight: 600 }}
                >
                  {stock.label || stock.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 3, borderTop: "2px solid", borderColor: "grey.100" }}
      >
        {selectedStockId && (
          <Button
            onClick={closeStockDialog}
            variant="outlined"
            sx={{
              color: "black",
              borderColor: "grey.300",
              borderRadius: 0,
              fontWeight: 700,
              "&:hover": { borderColor: "black", bgcolor: "white" },
            }}
          >
            CANCEL
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedStockId || isStocksLoading}
          sx={{
            bgcolor: "black",
            color: "white",
            borderRadius: 0,
            fontWeight: 700,
            px: 3,
            "&:hover": { bgcolor: "grey.900" },
            "&:disabled": { bgcolor: "grey.300" },
          }}
        >
          CONTINUE
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  InputAdornment,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconSearch,
  IconReceipt,
  IconCash,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  searchPosProducts,
  fetchPosProducts,
  setShowStockDialog,
} from "@/lib/posSlice/posSlice";
import POSInvoiceDialog from "./POSInvoiceDialog";
import POSPettyCashDialog from "./POSPettyCashDialog";
import POSSettingsDialog from "./POSSettingsDialog";

export default function POSHero() {
  const dispatch = useAppDispatch();
  const { selectedStockId, stocks } = useAppSelector((state) => state.pos);
  const currentStock = stocks.find((s) => s.id === selectedStockId);

  const [query, setQuery] = useState("");
  const [showInvoicesForm, setShowInvoicesForm] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockId) return;

    if (query.trim()) {
      dispatch(searchPosProducts({ stockId: selectedStockId, query }));
    } else {
      dispatch(fetchPosProducts(selectedStockId));
    }
  };

  const handleRefresh = () => {
    if (selectedStockId) {
      dispatch(fetchPosProducts(selectedStockId));
      setQuery("");
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Top Row: Stock Info & Quick Actions */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            border: "2px solid",
            borderColor: "black",
            borderRadius: 0,
            bgcolor: "white",
          }}
        >
          {/* Stock Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              height: 40,
              bgcolor: "white",
              border: "2px solid",
              borderColor: "black",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "black", color: "white" },
              "&:hover .stock-label": { color: "white" },
              flex: 1,
            }}
            onClick={() => dispatch(setShowStockDialog(true))}
          >
            <Typography
              className="stock-label"
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "grey.500",
              }}
            >
              Location:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={800}
              sx={{ textTransform: "uppercase" }}
            >
              {currentStock?.label || currentStock?.name || "SELECT STOCK"}
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Invoices">
              <IconButton
                onClick={() => setShowInvoicesForm(true)}
                sx={{
                  bgcolor: "white",
                  color: "black",
                  border: "2px solid",
                  borderColor: "grey.200",
                  borderRadius: 0,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    borderColor: "black",
                    bgcolor: "black",
                    color: "white",
                  },
                }}
              >
                <IconReceipt size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Petty Cash">
              <IconButton
                onClick={() => setShowCashDialog(true)}
                sx={{
                  bgcolor: "white",
                  color: "black",
                  border: "2px solid",
                  borderColor: "grey.200",
                  borderRadius: 0,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    borderColor: "black",
                    bgcolor: "black",
                    color: "white",
                  },
                }}
              >
                <IconCash size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettingsDialog(true)}
                sx={{
                  bgcolor: "white",
                  color: "black",
                  border: "2px solid",
                  borderColor: "grey.200",
                  borderRadius: 0,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    borderColor: "black",
                    bgcolor: "black",
                    color: "white",
                  },
                }}
              >
                <IconSettings size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Bottom Row: Search Form */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: "2px solid",
            borderColor: "black",
            borderRadius: 0,
            bgcolor: "white",
          }}
        >
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ display: "flex", gap: 1, width: "100%" }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="SEARCH PRODUCTS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 0,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  bgcolor: "grey.50",
                  "&.Mui-focused": {
                    bgcolor: "white",
                  },
                  "& fieldset": {
                    border: "2px solid",
                    borderColor: "transparent",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "black !important",
                  },
                  "&:hover fieldset": {
                    borderColor: "grey.300",
                  },
                },
              }}
            />
            <IconButton
              type="submit"
              sx={{
                bgcolor: "black",
                color: "white",
                borderRadius: 0,
                width: 40,
                height: 40,
                "&:hover": { bgcolor: "grey.800" },
              }}
            >
              <IconSearch size={20} />
            </IconButton>
            <IconButton
              onClick={handleRefresh}
              sx={{
                bgcolor: "white",
                color: "black",
                border: "2px solid",
                borderColor: "grey.200",
                borderRadius: 0,
                width: 40,
                height: 40,
                "&:hover": { borderColor: "black" },
              }}
            >
              <IconRefresh size={20} />
            </IconButton>
          </Box>
        </Paper>
      </Box>

      {/* Dialogs */}
      <POSInvoiceDialog
        open={showInvoicesForm}
        onClose={() => setShowInvoicesForm(false)}
      />
      <POSPettyCashDialog
        open={showCashDialog}
        onClose={() => setShowCashDialog(false)}
      />
      <POSSettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </>
  );
}

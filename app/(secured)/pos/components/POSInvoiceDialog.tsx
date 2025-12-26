"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { IconSearch, IconX, IconEye, IconPrinter } from "@tabler/icons-react";
import { auth } from "@/firebase/firebaseClient";
import { pdf } from "@react-pdf/renderer";
import POSInvoicePDF from "./POSInvoicePDF";
import { Order } from "@/model/Order";

interface POSInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function POSInvoiceDialog({
  open,
  onClose,
}: POSInvoiceDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`/api/pos/orders/${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Order not found");
      }

      const data = await res.json();

      // API returns single order object, wrap in array for table display
      if (data && data.orderId) {
        setInvoices([data]);
      } else if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Failed to search invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setInvoices([]);
    setSearched(false);
    onClose();
  };

  const printInvoice = async (order: Order) => {
    try {
      console.log("Printing order:", order); // Debug log
      if (!order || !order.items) {
        alert("Invalid order data for printing.");
        return;
      }

      const blob = await pdf(<POSInvoicePDF order={order} />).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank");

      if (!printWindow) {
        alert("Popup blocked! Please allow popups to print invoices.");
        return;
      }

      printWindow.onload = () => printWindow.focus();
    } catch (err) {
      console.error("Printing failed", err);
      alert("Printing failed. See console for details.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Search Invoices
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Search Bar */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                minWidth: 100,
                bgcolor: "black",
                color: "white",
                "&:hover": { bgcolor: "grey.900" },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Search"
              )}
            </Button>
          </Box>

          {/* Results */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "black" }} />
            </Box>
          ) : searched && invoices.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography color="text.secondary">No invoices found</Typography>
            </Box>
          ) : invoices.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.orderId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          #{inv.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{inv.items?.length || 0} items</TableCell>
                      <TableCell align="right">
                        Rs. {inv.total?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor:
                              inv.status === "Completed"
                                ? "success.light"
                                : "warning.light",
                            color:
                              inv.status === "Completed"
                                ? "success.dark"
                                : "warning.dark",
                          }}
                        >
                          {inv.status}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => printInvoice(inv)}
                            title="Print Invoice"
                          >
                            <IconPrinter size={18} />
                          </IconButton>
                          {/* <IconButton size="small">
                            <IconEye size={18} />
                          </IconButton> */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

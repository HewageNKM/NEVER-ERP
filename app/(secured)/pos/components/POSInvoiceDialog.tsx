"use client";

import React, { useState, useEffect } from "react";
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
import {
  IconSearch,
  IconX,
  IconEye,
  IconPrinter,
  IconArrowLeft,
} from "@tabler/icons-react";
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
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (invoiceUrl) URL.revokeObjectURL(invoiceUrl);
    };
  }, [invoiceUrl]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setInvoiceUrl(null); // Clear previous invoice view if any
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
    setInvoiceUrl(null);
    onClose();
  };

  const handleViewInvoice = async (order: Order) => {
    try {
      if (!order || !order.items) {
        alert("Invalid order data for viewing.");
        return;
      }

      setLoading(true);
      const blob = await pdf(<POSInvoicePDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      setInvoiceUrl(url);
    } catch (err) {
      console.error("Failed to generate invoice", err);
      alert("Failed to generate invoice. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (invoiceUrl) {
      const printWindow = window.open(invoiceUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => printWindow.focus();
      } else {
        alert("Popup blocked! Please allow popups to print invoices.");
      }
    }
  };

  const handleBack = () => {
    setInvoiceUrl(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: "600px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {invoiceUrl && (
            <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
              <IconArrowLeft size={20} />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700}>
            {invoiceUrl ? "Invoice Preview" : "Search Invoices"}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {invoiceUrl ? (
          <Box
            sx={{
              height: "500px",
              width: "100%",
              bgcolor: "grey.100",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <iframe
              src={invoiceUrl}
              width="100%"
              height="100%"
              style={{ border: "none", flex: 1 }}
              title="Invoice Preview"
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
            {/* Search Bar */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter invoice ID (e.g. inv_...)"
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
                <Typography color="text.secondary">
                  No invoices found
                </Typography>
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
                              onClick={() => handleViewInvoice(inv)}
                              title="View Invoice"
                            >
                              <IconEye size={18} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: "1px solid", borderColor: "grey.200" }}
      >
        {invoiceUrl ? (
          <>
            <Button onClick={handleBack} variant="outlined" color="inherit">
              Back
            </Button>
            <Button
              onClick={handlePrint}
              variant="contained"
              startIcon={<IconPrinter size={18} />}
              sx={{
                bgcolor: "black",
                color: "white",
                "&:hover": { bgcolor: "grey.900" },
              }}
            >
              Print
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="outlined" color="inherit">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

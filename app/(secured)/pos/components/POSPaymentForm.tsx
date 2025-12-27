"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
} from "@mui/material";
import { IconX, IconPlus, IconTrash, IconPrinter } from "@tabler/icons-react";
import { usePOS } from "../context/POSContext";
import { POSPayment, POSPaymentMethod } from "@/model/POSTypes";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import { pdf } from "@react-pdf/renderer";
import POSInvoicePDF from "./POSInvoicePDF";
import { Order } from "@/model/Order";

export default function POSPaymentForm() {
  const {
    items,
    invoiceId,
    showPaymentDialog,
    selectedStockId,
    closePaymentDialog,
    loadCart,
    regenerateInvoiceId,
  } = usePOS();

  const [payments, setPayments] = useState<POSPayment[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [referenceId, setReferenceId] = useState(""); // For KOKO payment reference
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<POSPaymentMethod[]>([]);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Calculate totals
  const itemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity * i.price, 0),
    [items]
  );
  // ... existing memo hooks ...
  const totalDiscount = useMemo(
    () => items.reduce((acc, i) => acc + i.discount, 0),
    [items]
  );
  const paymentsTotal = useMemo(
    () => payments.reduce((acc, p) => acc + p.amount, 0),
    [payments]
  );
  const subtotal = useMemo(
    () => itemsTotal - totalDiscount,
    [itemsTotal, totalDiscount]
  );

  // Calculate customer fee for pm-006 (KOKO) payment method (80% of the fee)
  // The payment.amount already includes the fee, so we need to back-calculate the base amount
  const customerFee = useMemo(() => {
    return payments.reduce((acc, payment) => {
      // Only apply 80% fee to customer for pm-006 (KOKO)
      if (payment.paymentMethodId === "pm-006") {
        const method = paymentMethods.find((m) => m.paymentId === "pm-006");
        if (method && method.fee > 0) {
          const feeMultiplier = 1 + (method.fee / 100) * 0.8; // e.g., 1 + 0.096 = 1.096
          const baseAmount = payment.amount / feeMultiplier; // Back-calculate base amount
          const feeAmount = payment.amount - baseAmount; // The fee portion
          return acc + Math.round(feeAmount * 100) / 100;
        }
      }
      return acc;
    }, 0);
  }, [payments, paymentMethods]);

  // Calculate pending due for non-KOKO (base subtotal minus non-KOKO payments)
  const nonKokoPaymentsTotal = useMemo(() => {
    return payments
      .filter((p) => p.paymentMethodId !== "pm-006")
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  // For KOKO, we need to calculate the pending base amount (not including KOKO fees)
  const pendingBaseAmount =
    subtotal -
    nonKokoPaymentsTotal -
    payments
      .filter((p) => p.paymentMethodId === "pm-006")
      .reduce((acc, payment) => {
        const method = paymentMethods.find((m) => m.paymentId === "pm-006");
        if (method && method.fee > 0) {
          const feeMultiplier = 1 + (method.fee / 100) * 0.8;
          return acc + payment.amount / feeMultiplier; // Base portion of KOKO payments
        }
        return acc + payment.amount;
      }, 0);

  const grandTotal = subtotal + customerFee;
  const pendingDue = grandTotal - paymentsTotal;

  // Check if KOKO is selected and calculate the pre-filled amount
  const isKokoSelected = useMemo(() => {
    const method = paymentMethods.find(
      (m) => m.name.toLowerCase() === selectedPaymentMethod.toLowerCase()
    );
    return method?.paymentId === "pm-006";
  }, [selectedPaymentMethod, paymentMethods]);

  // Pre-calculated amount for KOKO (remaining base amount + 80% of fee on that amount)
  const kokoPreCalculatedAmount = useMemo(() => {
    if (!isKokoSelected || pendingBaseAmount <= 0) return 0;
    const method = paymentMethods.find((m) => m.paymentId === "pm-006");
    if (!method || method.fee <= 0) return Math.max(0, pendingBaseAmount);
    // Amount customer pays = baseAmount × (1 + fee% × 80%)
    const feeMultiplier = 1 + (method.fee / 100) * 0.8;
    return Math.round(pendingBaseAmount * feeMultiplier * 100) / 100;
  }, [isKokoSelected, pendingBaseAmount, paymentMethods]);

  const fetchPaymentMethods = async () => {
    // ... existing fetch ...
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/pos/payment-methods", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch payment methods");

      const data = await res.json();
      if (Array.isArray(data)) {
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      toast.error("Could not load payment methods");
    }
  };

  useEffect(() => {
    if (showPaymentDialog && auth.currentUser) {
      fetchPaymentMethods();
    }
    // Cleanup URL object
    return () => {
      if (invoiceUrl) URL.revokeObjectURL(invoiceUrl);
    };
  }, [showPaymentDialog, auth.currentUser]); // Logic for cleanup slightly wrong here, needs dedicated effect or cleanup in close

  useEffect(() => {
    return () => {
      if (invoiceUrl) URL.revokeObjectURL(invoiceUrl);
    };
  }, [invoiceUrl]);

  const handleAddPayment = () => {
    // For KOKO, use pre-calculated amount
    const amount = isKokoSelected
      ? kokoPreCalculatedAmount
      : parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // For non-cash methods (except KOKO), don't allow overpayment
    if (
      selectedPaymentMethod !== "cash" &&
      !isKokoSelected &&
      amount > pendingDue + 0.5
    ) {
      toast.error("Amount exceeds the due amount");
      return;
    }

    // Card requires last 4 digits
    if (selectedPaymentMethod === "card" && cardNumber.length !== 4) {
      toast.error("Please enter the last 4 digits of the card");
      return;
    }

    // KOKO requires reference ID
    if (isKokoSelected && !referenceId.trim()) {
      toast.error("Please enter the KOKO Payment ID");
      return;
    }

    const method = paymentMethods.find(
      (m) => m.name.toLowerCase() === selectedPaymentMethod
    );

    const newPayment: POSPayment = {
      id: Date.now().toString().slice(-4),
      paymentMethod: selectedPaymentMethod,
      paymentMethodId: method?.paymentId || "",
      amount,
      cardNumber: cardNumber || "None",
      ...(referenceId.trim() && { referenceId: referenceId.trim() }),
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount("");
    setCardNumber("");
    setReferenceId("");
    setSelectedPaymentMethod("cash");
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handlePlaceOrder = async () => {
    if (paymentsTotal < grandTotal) {
      toast.error("Payment amount is less than total");
      return;
    }

    setLoading(true);
    try {
      // ... existing order construction ...
      // Calculate transaction fees on full payment amount (what processor charges)
      const transactionFeeCharge = payments.reduce((acc, payment) => {
        const method = paymentMethods.find(
          (m) => m.name.toLowerCase() === payment.paymentMethod.toLowerCase()
        );
        const feePercent = method?.fee || 0;
        return acc + payment.amount * (feePercent / 100);
      }, 0);

      const order = {
        orderId: invoiceId?.toLowerCase(),
        items: items.map((i) => ({
          itemId: i.itemId,
          bPrice: i.bPrice,
          variantId: i.variantId,
          name: i.name,
          variantName: i.variantName || i.size || "Default", // Fallback
          size: i.size,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
        })),
        fee: customerFee,
        shippingFee: 0,
        discount: totalDiscount,
        paymentReceived: payments,
        from: "Store",
        stockId: selectedStockId,
        status: "Completed",
        paymentStatus: "Paid",
        paymentMethod:
          payments.length > 1
            ? "MIXED"
            : payments[0]?.paymentMethod?.toUpperCase(),
        ...(payments.length === 1 && {
          paymentMethodId: payments[0].paymentMethodId,
        }),
        total: Math.round(grandTotal * 100) / 100,
        transactionFeeCharge: Math.round(transactionFeeCharge * 100) / 100,
      };

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to place order");
      }

      const data = await res.json();

      if (data.order) {
        toast.success("Order created successfully!");

        // Generate Invoice URL
        const blob = await pdf(<POSInvoicePDF order={data.order} />).toBlob();
        const url = URL.createObjectURL(blob);
        setInvoiceUrl(url);
        setCompletedOrder(data.order);

        // Don't print automatically? Or maybe still do?
        // User asked to "load invoice inside... print from there".
        // I'll skip auto-popup print if showing inside.
      }

      regenerateInvoiceId();
      // DO NOT close dialog here
      setPayments([]);
      setPaymentAmount("");
      setCardNumber("");
      loadCart();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayments([]);
    setPaymentAmount("");
    setCardNumber("");
    setInvoiceUrl(null);
    setCompletedOrder(null);
    closePaymentDialog();
  };

  return (
    <Dialog
      open={showPaymentDialog}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 0, border: "2px solid black" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ textTransform: "uppercase" }}
        >
          Complete Payment
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: "black",
            borderRadius: 0,
            "&:hover": { bgcolor: "black", color: "white" },
          }}
        >
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
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
        ) : invoiceUrl ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "500px",
                border: "1px solid",
                borderColor: "grey.200",
                bgcolor: "grey.50",
              }}
            >
              <iframe
                src={invoiceUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Invoice Preview"
              />
            </Box>
            <Typography variant="body2" color="success.main" fontWeight={700}>
              Order Completed Successfully!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Payments Table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "2px solid",
                borderColor: "grey.200",
                borderRadius: 0,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Method
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Card
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Amount (LKR)
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography
                          variant="body2"
                          color="grey.500"
                          fontWeight={600}
                          sx={{ textTransform: "uppercase" }}
                        >
                          No payments added yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow
                        key={p.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell>{p.id}</TableCell>
                        <TableCell
                          sx={{ textTransform: "uppercase", fontWeight: 700 }}
                        >
                          {p.paymentMethod}
                        </TableCell>
                        <TableCell>{p.cardNumber}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {p.amount.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePayment(p.id)}
                            sx={{
                              color: "grey.400",
                              borderRadius: 0,
                              "&:hover": { color: "error.main" },
                            }}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add Payment Form */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "flex-end",
              }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ "&.Mui-focused": { color: "black" } }}>
                  Payment Method
                </InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  label="Payment Method"
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  sx={{
                    borderRadius: 0,
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "black",
                    },
                  }}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m.paymentId} value={m.name.toLowerCase()}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedPaymentMethod === "card" && (
                <TextField
                  size="small"
                  label="Last 4 Digits"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.slice(0, 4))}
                  inputProps={{ maxLength: 4 }}
                  sx={{
                    width: 120,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                      "&.Mui-focused fieldset": { borderColor: "black" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "black" },
                  }}
                />
              )}

              {/* Payment ID field - available for all payment methods */}
              <TextField
                size="small"
                label="Payment ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Optional"
                sx={{
                  width: 140,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    "&.Mui-focused fieldset": { borderColor: "black" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "black" },
                }}
              />

              {/* Amount field - read-only for KOKO */}
              {isKokoSelected ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "primary.50",
                    border: "2px solid",
                    borderColor: "primary.200",
                    px: 2,
                    py: 1,
                    minWidth: 150,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={700}
                    sx={{ textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    Amount to Collect
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={800}
                    color="primary.main"
                  >
                    Rs. {kokoPreCalculatedAmount.toLocaleString()}
                  </Typography>
                </Box>
              ) : (
                <TextField
                  size="small"
                  label="Amount (LKR)"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  sx={{
                    width: 150,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                      "&.Mui-focused fieldset": { borderColor: "black" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "black" },
                  }}
                />
              )}

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={handleAddPayment}
                sx={{
                  height: 40,
                  bgcolor: "black",
                  color: "white",
                  borderRadius: 0,
                  fontWeight: 700,
                  "&:hover": { bgcolor: "grey.900" },
                }}
              >
                ADD
              </Button>
            </Box>

            <Divider sx={{ borderColor: "grey.200" }} />

            {/* Summary */}
            <Box
              sx={{
                bgcolor: "white",
                p: 2,
                border: "2px solid",
                borderColor: "grey.200",
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant="body2"
                  color="grey.600"
                  fontWeight={600}
                  sx={{ textTransform: "uppercase" }}
                >
                  Subtotal:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Rs. {itemsTotal.toLocaleString()}
                </Typography>
              </Box>
              {totalDiscount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    color: "error.main",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase" }}
                  >
                    Discount:
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    -Rs. {totalDiscount.toLocaleString()}
                  </Typography>
                </Box>
              )}
              {customerFee > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    bgcolor: "primary.50",
                    p: 1,
                    mx: -1,
                    border: "1px dashed",
                    borderColor: "primary.200",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ textTransform: "uppercase" }}
                  >
                    Processing Fee:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    color="primary.main"
                  >
                    Rs. {customerFee.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ textTransform: "uppercase" }}
                >
                  Total Paid:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Rs. {paymentsTotal.toLocaleString()}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ textTransform: "uppercase" }}
                >
                  {pendingDue > 0 ? "Due Amount:" : "Change Due:"}
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  color={pendingDue > 0 ? "error.main" : "success.main"}
                >
                  Rs. {Math.abs(pendingDue).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 3, borderTop: "2px solid", borderColor: "grey.100" }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            color: "black",
            borderColor: "grey.300",
            borderRadius: 0,
            fontWeight: 700,
            "&:hover": { borderColor: "black", bgcolor: "white" },
          }}
        >
          {invoiceUrl ? "CLOSE" : "CANCEL"}
        </Button>
        {!invoiceUrl && (
          <Button
            onClick={handlePlaceOrder}
            variant="contained"
            disabled={paymentsTotal < subtotal || loading}
            startIcon={<IconPrinter size={18} />}
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
            CONFIRM & PRINT
          </Button>
        )}
        {invoiceUrl && (
          <Button
            onClick={() => window.open(invoiceUrl, "_blank")}
            variant="contained"
            startIcon={<IconPrinter size={18} />}
            sx={{
              bgcolor: "black",
              color: "white",
              borderRadius: 0,
              fontWeight: 700,
              px: 3,
              "&:hover": { bgcolor: "grey.900" },
            }}
          >
            OPEN PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

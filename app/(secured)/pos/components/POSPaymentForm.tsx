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
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<POSPaymentMethod[]>([]);

  // Calculate totals
  const itemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity * i.price, 0),
    [items]
  );
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
  const pendingDue = subtotal - paymentsTotal;

  const fetchPaymentMethods = async () => {
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
    if (auth.currentUser) fetchPaymentMethods();
  }, [auth.currentUser]);

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // For non-cash methods, don't allow overpayment
    if (selectedPaymentMethod !== "cash" && amount > pendingDue + 0.5) {
      toast.error("Amount exceeds the due amount");
      return;
    }

    // Card requires last 4 digits
    if (selectedPaymentMethod === "card" && cardNumber.length !== 4) {
      toast.error("Please enter the last 4 digits of the card");
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
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount("");
    setCardNumber("");
    setSelectedPaymentMethod("cash");
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handlePlaceOrder = async () => {
    if (paymentsTotal < subtotal) {
      toast.error("Payment amount is less than total");
      return;
    }

    setLoading(true);
    try {
      // Calculate transaction fees
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
          variantName: i.variantName,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
        })),
        fee: 0,
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
        total: Math.round(subtotal * 100) / 100,
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

      toast.success("Order placed successfully!");

      // Clear state and regenerate invoice ID
      setPayments([]);
      loadCart();
      regenerateInvoiceId();
      closePaymentDialog();
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayments([]);
    setPaymentAmount("");
    setCardNumber("");
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
          CANCEL
        </Button>
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
      </DialogActions>
    </Dialog>
  );
}

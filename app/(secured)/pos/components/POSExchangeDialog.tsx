"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  IconX,
  IconSearch,
  IconArrowsExchange,
  IconPlus,
  IconMinus,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { auth } from "@/firebase/firebaseClient";
import { usePOS } from "../context/POSContext";
import POSVariantDialog from "./POSVariantDialog";
import toast from "react-hot-toast";

/* ================= TYPES ================= */

interface ExchangeItem {
  itemId: string;
  variantId: string;
  name: string;
  variantName: string;
  size: string;
  quantity: number;
  price: number;
  discount?: number;
  maxQuantity?: number;
}

interface OrderData {
  orderId: string;
  docId: string;
  items: any[];
  createdAt: string;
  total: number;
  customer?: { name?: string };
}

interface POSExchangeDialogProps {
  open: boolean;
  onClose: () => void;
}

/* ================= COMPONENT ================= */

export default function POSExchangeDialog({
  open,
  onClose,
}: POSExchangeDialogProps) {
  const { selectedStockId } = usePOS();

  /* ===== Order lookup ===== */
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [eligible, setEligible] = useState(false);
  const [workingDays, setWorkingDays] = useState<number | null>(null);

  /* ===== Exchange state ===== */
  const [returnedItems, setReturnedItems] = useState<ExchangeItem[]>([]);
  const [replacementItems, setReplacementItems] = useState<ExchangeItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  /* ===== Search ===== */
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/settings/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPaymentMethods(data.filter((m: any) => m.isActive));
        }
      })
      .catch((err) => console.error("Failed to load payment methods", err));
  }, []);

  /* ===== Search ===== */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showVariantDialog, setShowVariantDialog] = useState(false);

  /* ===== Totals ===== */
  const returnTotal = returnedItems.reduce(
    (sum, i) => sum + (i.price * i.quantity - (i.discount || 0)),
    0
  );

  const replacementTotal = replacementItems.reduce(
    (sum, i) => sum + i.price * i.quantity - (i.discount || 0),
    0
  );

  const priceDifference = replacementTotal - returnTotal;
  const isRefundRequired = priceDifference < 0;

  /* ================= FUNCTIONS ================= */

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setOrderData(null);
    setEligible(false);
    setReturnedItems([]);
    setReplacementItems([]);
    setSearchQuery("");
    setSearchResults([]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({ orderId: orderId.trim() });
      if (selectedStockId) params.append("stockId", selectedStockId);

      const res = await fetch(`/api/pos/exchange?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.eligible && data.order) {
        setEligible(true);
        setOrderData(data.order);
        setWorkingDays(data.workingDaysElapsed);
      } else {
        setError(data.message || "Order not eligible");
        setWorkingDays(data.workingDaysElapsed || null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to lookup order");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedStockId) return;

    setSearching(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(
        `/api/pos/products?stockId=${selectedStockId}&search=${encodeURIComponent(
          searchQuery
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Product search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setShowVariantDialog(true);
  };

  const handleAddReplacement = (item: any) => {
    const index = replacementItems.findIndex(
      (r) =>
        r.itemId === item.itemId &&
        r.variantId === item.variantId &&
        r.size === item.size
    );

    if (index >= 0) {
      const updated = [...replacementItems];
      updated[index].quantity += item.quantity;
      updated[index].discount =
        (updated[index].discount || 0) + (item.discount || 0);
      setReplacementItems(updated);
    } else {
      setReplacementItems([...replacementItems, item]);
    }

    setSearchQuery("");
    setSearchResults([]);
  };

  const addToReturn = (item: any) => {
    const existing = returnedItems.find(
      (r) =>
        r.itemId === item.itemId &&
        r.variantId === item.variantId &&
        r.size === item.size
    );

    if (existing) {
      if (existing.quantity < item.quantity) {
        existing.quantity += 1;
        // Prorate discount
        if (item.discount) {
          existing.discount =
            (item.discount / item.quantity) * existing.quantity;
        }
        setReturnedItems([...returnedItems]);
      }
    } else {
      setReturnedItems([
        ...returnedItems,
        {
          itemId: item.itemId,
          variantId: item.variantId,
          name: item.name,
          variantName: item.variantName || "",
          size: item.size,
          quantity: 1,
          price: item.price,
          discount: item.discount ? item.discount / item.quantity : 0,
          maxQuantity: item.quantity,
        },
      ]);
    }
  };

  const removeFromReturn = (item: ExchangeItem) => {
    if (item.quantity > 1) {
      item.quantity -= 1;
      // Prorate discount reduction
      if (item.discount) {
        const oldQty = item.quantity + 1;
        item.discount = (item.discount / oldQty) * item.quantity;
      }
      setReturnedItems([...returnedItems]);
    } else {
      setReturnedItems(
        returnedItems.filter(
          (r) =>
            !(
              r.itemId === item.itemId &&
              r.variantId === item.variantId &&
              r.size === item.size
            )
        )
      );
    }
  };

  const handleProcessExchange = async () => {
    if (!returnedItems.length || !replacementItems.length) {
      setError("Select return & replacement items");
      return;
    }

    if (isRefundRequired) {
      setError("Refunds are not allowed");
      return;
    }

    setProcessing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/pos/exchange", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalOrderId: orderData?.orderId,
          stockId: selectedStockId,
          returnedItems,
          replacementItems,
          notes,
          paymentMethod: priceDifference > 0 ? paymentMethod : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.message || "Exchange failed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setOrderId("");
    setOrderData(null);
    setEligible(false);
    setError(null);
    setReturnedItems([]);
    setReplacementItems([]);
    setSearchQuery("");
    setSearchResults([]);
    setSuccess(false);
    setNotes("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          border: "2px solid black",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid black",
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconArrowsExchange size={24} />
          <Typography variant="h6" fontWeight={800} textTransform="uppercase">
            Item Exchange
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {success ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <IconCheck size={64} color="green" />
            <Typography variant="h5" fontWeight={800} sx={{ mt: 2 }}>
              EXCHANGE COMPLETED
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              The exchange has been processed successfully.
            </Typography>
            {priceDifference > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: "2px solid black",
                  bgcolor: "white",
                }}
              >
                <Typography fontWeight={800}>
                  CUSTOMER OWES: Rs. {priceDifference.toLocaleString()}
                </Typography>
              </Box>
            )}
            {priceDifference < 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: "2px solid black",
                  bgcolor: "black",
                  color: "white",
                }}
              >
                <Typography fontWeight={800} color="error.light">
                  REFUND NOT ALLOWED (Rs.{" "}
                  {Math.abs(priceDifference).toLocaleString()})
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                mt: 3,
                bgcolor: "black",
                "&:hover": { bgcolor: "grey.800" },
                borderRadius: 0,
              }}
            >
              Close
            </Button>
          </Box>
        ) : !orderData ? (
          /* Order Lookup */
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the order ID to look up and verify eligibility (within 14
              working days)
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter Order ID (e.g., ORD-001)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchOrder()}
                InputProps={{
                  sx: { borderRadius: 0, fontWeight: 700 },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearchOrder}
                disabled={loading || !orderId.trim()}
                sx={{
                  bgcolor: "black",
                  "&:hover": { bgcolor: "grey.800" },
                  borderRadius: 0,
                  minWidth: 120,
                }}
              >
                {loading ? <CircularProgress size={20} /> : <IconSearch />}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {workingDays !== null && !eligible && (
              <Alert
                severity="warning"
                sx={{ mt: 2 }}
                icon={<IconAlertCircle />}
              >
                Order is {workingDays} working days old. Exchange window is 14
                working days.
              </Alert>
            )}
          </Box>
        ) : (
          /* Exchange Form */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Order Info */}
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid", borderColor: "grey.200" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ORDER
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {orderData.orderId}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Chip
                    label={`${workingDays} working days ago`}
                    color="success"
                    size="small"
                  />
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Total: Rs. {orderData.total?.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}

            {/* Two Column Layout */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              {/* Left: Items to Return */}
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 1, textTransform: "uppercase" }}
                >
                  Items to Return
                </Typography>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: "1px solid", borderColor: "grey.200" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "black" }}>
                        <TableCell sx={{ fontWeight: 800, color: "white" }}>
                          ITEM
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "white" }}>
                          SIZE
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "white" }}>
                          QTY
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderData.items.map((item: any, idx: number) => {
                        const returned = returnedItems.find(
                          (r) =>
                            r.itemId === item.itemId &&
                            r.variantId === item.variantId &&
                            r.size === item.size
                        );
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Rs. {item.price?.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>
                              {returned?.quantity || 0} / {item.quantity}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    returned && removeFromReturn(returned)
                                  }
                                  disabled={!returned}
                                >
                                  <IconMinus size={16} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => addToReturn(item)}
                                  disabled={
                                    (returned?.quantity || 0) >= item.quantity
                                  }
                                >
                                  <IconPlus size={16} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>
                  Return Value: Rs. {returnTotal.toLocaleString()}
                </Typography>
              </Box>

              {/* Right: Replacement Items */}
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 1, textTransform: "uppercase" }}
                >
                  Replacement Items
                </Typography>

                {/* Product Search */}
                <Box
                  component="form"
                  onSubmit={handleProductSearch}
                  sx={{ display: "flex", gap: 1, mb: 2 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search replacement product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ sx: { borderRadius: 0 } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: "black",
                      color: "white",
                      borderRadius: 0,
                      minWidth: 40,
                      "&:hover": { bgcolor: "grey.800" },
                    }}
                  >
                    {searching ? (
                      <CircularProgress size={20} sx={{ color: "white" }} />
                    ) : (
                      <IconSearch size={20} />
                    )}
                  </Button>
                </Box>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    {searchResults.map((prod) => (
                      <Box
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        sx={{
                          p: 1,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "grey.100" },
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid",
                          borderColor: "grey.100",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {prod.name}
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                          Rs. {prod.sellingPrice?.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {replacementItems.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ border: "1px solid", borderColor: "grey.200", mb: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "black" }}>
                          <TableCell sx={{ fontWeight: 800, color: "white" }}>
                            ITEM
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "white" }}>
                            SIZE
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "white" }}>
                            QTY
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {replacementItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Rs. {item.price?.toLocaleString()}
                                {item.discount && item.discount > 0 && (
                                  <Box
                                    component="span"
                                    sx={{
                                      color: "success.main",
                                      ml: 1,
                                      fontWeight: 700,
                                    }}
                                  >
                                    (-Rs.{" "}
                                    {(
                                      item.discount / item.quantity
                                    ).toLocaleString()}
                                    )
                                  </Box>
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => removeFromReplacement(item)}
                                >
                                  <IconMinus size={16} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleSelectProduct({
                                      id: item.itemId,
                                      name: item.name,
                                      sellingPrice: item.price,
                                      discount: 0,
                                      thumbnail: "",
                                      variants: [
                                        {
                                          id: item.variantId,
                                          variantName: item.variantName,
                                          images: [{ url: "" }],
                                          discount: 0,
                                        },
                                      ],
                                    })
                                  } // Mock for edit not full implementation
                                >
                                  <IconPlus size={16} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Select products from POS to add as replacements
                  </Alert>
                )}
                <Typography variant="body2" fontWeight={700}>
                  Replacement Value: Rs. {replacementTotal.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Notes */}
            <TextField
              fullWidth
              size="small"
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              InputProps={{ sx: { borderRadius: 0 } }}
            />

            {/* Price Difference Summary */}
            <Divider />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: priceDifference < 0 ? "black" : "white",
                color: priceDifference < 0 ? "white" : "black",
                border: "2px solid",
                borderColor: "black",
                boxShadow: "4px 4px 0px rgba(0,0,0,1)",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={900}
                color={priceDifference < 0 ? "error.main" : "inherit"}
              >
                {priceDifference >= 0 ? "CUSTOMER OWES" : "REFUND NOT ALLOWED"}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={900}
                color={priceDifference < 0 ? "error.main" : "inherit"}
              >
                Rs. {Math.abs(priceDifference).toLocaleString()}
              </Typography>
            </Box>

            {priceDifference < 0 && (
              <Alert severity="error" sx={{ mt: 0 }}>
                Exchange value must be equal or greater than return value.
                Refunds are not enabled.
              </Alert>
            )}
          </Box>
        )}

        {/* Payment Method Selection (Only if customer owes money) */}
        {priceDifference > 0 && (
          <Box
            sx={{ mt: 3, p: 2, border: "1px solid", borderColor: "grey.200" }}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              SELECT PAYMENT METHOD
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {paymentMethods.map((pm) => (
                <Chip
                  key={pm.id}
                  label={pm.name}
                  onClick={() => setPaymentMethod(pm.name)}
                  color={paymentMethod === pm.name ? "primary" : "default"}
                  variant={paymentMethod === pm.name ? "filled" : "outlined"}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 700,
                    bgcolor:
                      paymentMethod === pm.name ? "black" : "transparent",
                    color: paymentMethod === pm.name ? "white" : "black",
                    borderColor: "black",
                    "&:hover": {
                      bgcolor:
                        paymentMethod === pm.name ? "grey.800" : "grey.100",
                    },
                  }}
                />
              ))}
              {paymentMethods.length === 0 && (
                <Typography variant="caption" color="error">
                  No payment methods available.
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {orderData && !success && (
        <DialogActions sx={{ p: 3, borderTop: "2px solid black" }}>
          <Button onClick={handleClose} sx={{ borderRadius: 0 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessExchange}
            disabled={
              processing ||
              returnedItems.length === 0 ||
              replacementItems.length === 0 ||
              isRefundRequired || // Disable if refund required
              (priceDifference > 0 && !paymentMethod) // Disable if payment required but not selected
            }
            sx={{
              bgcolor: "black",
              "&:hover": { bgcolor: "grey.800" },
              borderRadius: 0,
              minWidth: 150,
            }}
          >
            {processing ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "PROCESS EXCHANGE"
            )}
          </Button>
        </DialogActions>
      )}
      <POSVariantDialog
        open={showVariantDialog}
        onClose={() => setShowVariantDialog(false)}
        product={selectedProduct}
        onAddToCart={handleAddReplacement}
      />
    </Dialog>
  );
}

"use client";

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  IconTrash,
  IconMinus,
  IconPlus,
  IconReceipt,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  removeItemFromCart,
  setShowPaymentDialog,
} from "@/lib/posSlice/posSlice";
import toast from "react-hot-toast";

export default function POSInvoiceDetails() {
  const dispatch = useAppDispatch();
  const { items, invoiceId, isInvoiceLoading } = useAppSelector(
    (state) => state.pos
  );

  // Calculate totals
  const { subtotal, totalDiscount, grandTotal } = useMemo(() => {
    const subtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
    const grandTotal = subtotal - totalDiscount;
    return { subtotal, totalDiscount, grandTotal };
  }, [items]);

  const handleRemoveItem = async (item: any) => {
    try {
      await dispatch(removeItemFromCart(item)).unwrap();
      toast.success("Item removed");
    } catch (error: any) {
      toast.error(error || "Failed to remove item");
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    dispatch(setShowPaymentDialog(true));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: "2px solid",
        borderColor: "black",
        borderRadius: 0,
        overflow: "hidden",
        bgcolor: "white",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "black",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconReceipt size={24} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            Invoice
          </Typography>
        </Box>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            bgcolor: "white",
            color: "black",
            px: 1,
            py: 0.5,
            borderRadius: 0,
            fontFamily: "monospace",
          }}
        >
          #{invoiceId || "------"}
        </Typography>
      </Box>

      {/* Items List */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
        }}
      >
        {isInvoiceLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress sx={{ color: "black" }} />
          </Box>
        ) : items.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "grey.400",
            }}
          >
            <IconReceipt size={48} stroke={1} />
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ mt: 1, textTransform: "uppercase" }}
            >
              CART IS EMPTY
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((item, index) => (
              <Box
                key={`${item.itemId}-${item.variantId}-${item.size}-${index}`}
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 1.5,
                  bgcolor: "white",
                  borderRadius: 0,
                  border: "2px solid",
                  borderColor: "grey.200",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "black" },
                }}
              >
                <Avatar
                  src={item.thumbnail || "/placeholder.png"}
                  variant="square"
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 0,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ textTransform: "uppercase" }}
                    noWrap
                  >
                    {item.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="grey.500"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase" }}
                  >
                    {item.variantName} | SIZE: {item.size}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Rs. {item.price.toLocaleString()} × {item.quantity}
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      Rs.{" "}
                      {(
                        item.price * item.quantity -
                        item.discount
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                  {item.discount > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "error.main",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      DISCOUNT: -Rs. {item.discount.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveItem(item)}
                  sx={{
                    alignSelf: "flex-start",
                    color: "grey.400",
                    borderRadius: 0,
                    "&:hover": { color: "red", bgcolor: "transparent" },
                  }}
                >
                  <IconTrash size={18} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Summary */}
      <Box
        sx={{
          p: 2,
          bgcolor: "grey.50",
          borderTop: "2px solid",
          borderColor: "black",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography
            variant="body2"
            color="grey.600"
            fontWeight={600}
            sx={{ textTransform: "uppercase" }}
          >
            Subtotal ({items.length})
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            Rs. {subtotal.toLocaleString()}
          </Typography>
        </Box>
        {totalDiscount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography
              variant="body2"
              color="error.main"
              fontWeight={600}
              sx={{ textTransform: "uppercase" }}
            >
              Discount
            </Typography>
            <Typography variant="body2" fontWeight={700} color="error.main">
              -Rs. {totalDiscount.toLocaleString()}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 1, borderColor: "grey.300" }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ textTransform: "uppercase" }}
          >
            Grand Total
          </Typography>
          <Typography variant="h6" fontWeight={900} sx={{ color: "black" }}>
            Rs. {grandTotal.toLocaleString()}
          </Typography>
        </Box>

        {/* Checkout Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={items.length === 0}
          onClick={handleCheckout}
          sx={{
            py: 2,
            fontSize: "1rem",
            fontWeight: 800,
            bgcolor: "black",
            color: "white",
            borderRadius: 0,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            "&:hover": { bgcolor: "grey.900" },
            "&:disabled": { bgcolor: "grey.300", color: "grey.500" },
          }}
        >
          PROCEED TO PAYMENT
        </Button>
      </Box>
    </Paper>
  );
}

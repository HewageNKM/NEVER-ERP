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
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { IconX, IconMinus, IconPlus } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addItemToCart } from "@/lib/posSlice/posSlice";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";

interface POSVariantDialogProps {
  open: boolean;
  onClose: () => void;
  product: any;
}

export default function POSVariantDialog({
  open,
  onClose,
  product,
}: POSVariantDialogProps) {
  const dispatch = useAppDispatch();
  const { selectedStockId } = useAppSelector((state) => state.pos);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch inventory when product changes
  useEffect(() => {
    if (open && product && selectedStockId) {
      fetchInventory();
    }
  }, [open, product, selectedStockId]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedVariant(product?.variants?.[0] || null);
      setSelectedSize("");
      setQuantity(1);
      setDiscount(0);
    }
  }, [open, product]);

  const fetchInventory = async () => {
    if (!product || !selectedStockId) return;
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `/api/pos/inventory?stockId=${selectedStockId}&productId=${product.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Get sizes for selected variant
  const getVariantSizes = () => {
    if (!selectedVariant || !inventory.length) return [];
    return inventory
      .filter((inv) => inv.variantId === selectedVariant.id && inv.quantity > 0)
      .map((inv) => ({
        size: inv.size,
        stock: inv.quantity,
      }));
  };

  const availableSizes = getVariantSizes();

  // Get stock for selected size
  const getSelectedStock = () => {
    if (!selectedVariant || !selectedSize) return 0;
    const inv = inventory.find(
      (i) => i.variantId === selectedVariant.id && i.size === selectedSize
    );
    return inv?.quantity || 0;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedSize || !product) {
      toast.error("Please select variant and size");
      return;
    }

    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const stockQty = getSelectedStock();
    if (quantity > stockQty) {
      toast.error(`Only ${stockQty} items available`);
      return;
    }

    setAdding(true);
    try {
      await dispatch(
        addItemToCart({
          itemId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          variantName:
            selectedVariant.variantName || selectedVariant.color || "Default",
          thumbnail: selectedVariant.images[0].url || product.thumbnail || "",
          size: selectedSize,
          discount: discount,
          type: "product",
          quantity: quantity,
          price: product.sellingPrice,
          bPrice: product.buyingPrice,
          stockId: selectedStockId!,
        })
      ).unwrap();

      toast.success("Added to cart");
      onClose();
    } catch (error: any) {
      toast.error(error || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 0, border: "2px solid black" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          borderBottom: "2px solid",
          borderColor: "grey.200",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ textTransform: "uppercase" }}
          >
            {product.name}
          </Typography>
          <Typography variant="body2" color="grey.500" fontWeight={700}>
            Rs. {product.sellingPrice?.toLocaleString()}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
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
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "black" }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    mb: 1.5,
                  }}
                >
                  Select Variant
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {product.variants.map((variant: any) => (
                    <Box
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedSize("");
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        border: "2px solid",
                        borderColor:
                          selectedVariant?.id === variant.id
                            ? "black"
                            : "grey.200",
                        bgcolor:
                          selectedVariant?.id === variant.id
                            ? "black"
                            : "transparent",
                        color:
                          selectedVariant?.id === variant.id
                            ? "white"
                            : "black",
                        borderRadius: 0,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "black",
                        },
                      }}
                    >
                      <Avatar
                        src={variant.images[0].url || product.thumbnail}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 0,
                          border: "1px solid white",
                        }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ textTransform: "uppercase" }}
                      >
                        {variant.variantName || variant.color || "Default"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Size Selection */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mb: 1.5,
                }}
              >
                Select Size
              </Typography>
              {availableSizes.length > 0 ? (
                <Grid container spacing={1}>
                  {availableSizes.map((sizeObj) => (
                    <Grid item key={sizeObj.size}>
                      <Chip
                        label={`${sizeObj.size} (${sizeObj.stock})`}
                        onClick={() => setSelectedSize(sizeObj.size)}
                        sx={{
                          fontWeight: 700,
                          borderRadius: 0,
                          height: 32,
                          bgcolor:
                            selectedSize === sizeObj.size ? "black" : "white",
                          color:
                            selectedSize === sizeObj.size ? "white" : "black",
                          border: "2px solid",
                          borderColor:
                            selectedSize === sizeObj.size
                              ? "black"
                              : "grey.200",
                          "&:hover": {
                            bgcolor:
                              selectedSize === sizeObj.size
                                ? "black"
                                : "grey.100",
                            borderColor: "black",
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sizes available for this variant
                </Typography>
              )}
            </Box>

            {/* Quantity */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mb: 1.5,
                }}
              >
                Quantity
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  sx={{
                    border: "2px solid",
                    borderColor: "grey.200",
                    borderRadius: 0,
                    height: 40,
                    width: 40,
                    color: "black",
                  }}
                >
                  <IconMinus size={16} />
                </IconButton>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  size="small"
                  sx={{
                    width: 60,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                      height: 40,
                      "& fieldset": {
                        border: "2px solid",
                        borderColor: "grey.200",
                        borderLeft: 0,
                        borderRight: 0,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "black !important",
                      },
                    },
                    "& input": { textAlign: "center", fontWeight: 700 },
                  }}
                  inputProps={{ min: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => setQuantity(quantity + 1)}
                  sx={{
                    border: "2px solid",
                    borderColor: "grey.200",
                    borderRadius: 0,
                    height: 40,
                    width: 40,
                    color: "black",
                  }}
                >
                  <IconPlus size={16} />
                </IconButton>
                <Typography
                  variant="caption"
                  color="grey.500"
                  fontWeight={700}
                  sx={{ ml: 2, textTransform: "uppercase" }}
                >
                  AVAILABLE STOCK: {getSelectedStock()}
                </Typography>
              </Box>
            </Box>

            {/* Discount */}
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mb: 1.5,
                }}
              >
                Discount (Rs.)
              </Typography>
              <TextField
                type="number"
                value={discount}
                onChange={(e) =>
                  setDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                }
                size="small"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    "&.Mui-focused fieldset": { borderColor: "black" },
                  },
                }}
                inputProps={{ min: 0 }}
              />
            </Box>

            {/* Summary */}
            <Box
              sx={{
                bgcolor: "grey.50",
                p: 2,
                border: "2px solid",
                borderColor: "grey.200",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" fontWeight={600} color="grey.600">
                  Subtotal:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Rs. {(product.sellingPrice * quantity).toLocaleString()}
                </Typography>
              </Box>
              {discount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "error.main",
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Discount:
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    -Rs. {discount.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 2,
                  pt: 2,
                  borderTop: "2px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  sx={{ textTransform: "uppercase" }}
                >
                  Total:
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  sx={{ color: "black" }}
                >
                  Rs.{" "}
                  {(
                    product.sellingPrice * quantity -
                    discount
                  ).toLocaleString()}
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
          onClick={onClose}
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
          onClick={handleAddToCart}
          variant="contained"
          disabled={!selectedVariant || !selectedSize || adding || loading}
          sx={{
            minWidth: 140,
            bgcolor: "black",
            color: "white",
            borderRadius: 0,
            fontWeight: 700,
            "&:hover": { bgcolor: "grey.900" },
          }}
        >
          {adding ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "ADD TO CART"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

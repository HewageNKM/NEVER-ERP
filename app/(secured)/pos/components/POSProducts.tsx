"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
} from "@mui/material";
import { usePOS } from "../context/POSContext";
import POSVariantDialog from "./POSVariantDialog";

export default function POSProducts() {
  const { products, selectedStockId } = usePOS();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setVariantDialogOpen(true);
  };

  if (!selectedStockId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "grey.50",
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          Please select a stock location to view products
        </Typography>
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "grey.50",
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          No products available at this stock location
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          bgcolor: "white",
          borderRadius: 0,
          p: 2,
          border: "2px solid",
          borderColor: "grey.200",
        }}
      >
        <Grid container spacing={2}>
          {products.map((product: any) => (
            <Grid item xs={6} sm={4} md={3} lg={3} key={product.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "2px solid",
                  borderColor: "transparent",
                  bgcolor: "grey.50",
                  borderRadius: 0,
                  "&:hover": {
                    borderColor: "black",
                    bgcolor: "white",
                    transform: "translateY(-4px)",
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  },
                }}
                onClick={() => handleProductClick(product)}
              >
                <Box sx={{ position: "relative", pt: "100%" }}>
                  <CardMedia
                    component="img"
                    image={product.thumbnail.url || "/placeholder.png"}
                    alt={product.name}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      p: 2,
                      bgcolor: "white",
                    }}
                  />
                  {product.discount && product.discount > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: "black",
                        color: "white",
                        px: 1,
                        py: 0.5,
                        fontSize: "0.7rem",
                        fontWeight: 900,
                        zIndex: 1,
                        border: "1px solid white",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {product.discount}% OFF
                    </Box>
                  )}
                  {product.variants?.length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        bgcolor: "white",
                        color: "black",
                        px: 0.8,
                        py: 0.3,
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        zIndex: 1,
                        border: "2px solid black",
                        boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
                      }}
                    >
                      {product.variants.length} VARIANTS
                    </Box>
                  )}
                </Box>
                <CardContent
                  sx={{ p: 2, borderTop: "2px solid", borderColor: "grey.100" }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "grey.500",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    {product.brand || "NEVERBE"}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      mb: 1,
                      minHeight: "2.4em",
                    }}
                    noWrap
                    title={product.name}
                  >
                    {product.name}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "end",
                    }}
                  >
                    <Box sx={{ width: "100%" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "grey.400",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                        }}
                      >
                        PRICE
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight={900}
                          sx={{
                            color:
                              product.discount && product.discount > 0
                                ? "error.main"
                                : "black",
                            lineHeight: 1,
                          }}
                        >
                          <span style={{ fontSize: "0.7em", marginRight: 2 }}>
                            Rs.
                          </span>
                          {product.discount && product.discount > 0
                            ? (
                                Math.round(
                                  (product.sellingPrice *
                                    (1 - product.discount / 100)) /
                                    10
                                ) * 10
                              ).toLocaleString()
                            : product.sellingPrice?.toLocaleString() || 0}
                        </Typography>
                        {product.discount && product.discount > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              textDecoration: "line-through",
                              color: "grey.400",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                            }}
                          >
                            Rs. {product.sellingPrice.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Variant Selection Dialog */}
      <POSVariantDialog
        open={variantDialogOpen}
        onClose={() => {
          setVariantDialogOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </>
  );
}

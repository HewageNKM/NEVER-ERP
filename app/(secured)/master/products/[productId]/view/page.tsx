"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Breadcrumbs, // <-- Import Breadcrumbs
} from "@mui/material";
import { IconCheck, IconX, IconPencil } from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient"; // Assuming paths
import axios from "axios";
import { Product } from "@/model/Product";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import { Img } from "@/model/Img";
import DashboardCard from "@/app/(secured)/components/shared/DashboardCard";
import { useAppSelector } from "@/lib/hooks";
import Image from "next/image";
import Link from "next/link"; // <-- Already imported

/**
 * A helper component to display a single product detail item.
 */
const DetailItem = ({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) => (
  <Box mb={1.5}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body1" fontWeight={500}>
      {value}
    </Typography>
  </Box>
);

const ProductViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.productId as string; // Get product ID from URL
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<Img[]>([]);

  // Fetch Product Data
  useEffect(() => {
    // Check for currentUser as well, based on your original code
    if (!id || !currentUser) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const response = await axios.get(`/api/v2/master/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          const prod: Product = response.data;
          setProduct(prod);

          // Set initial image
          setSelectedImageUrl(prod.thumbnail.url);

          // Create a combined list of all images
          const variantImages = prod.variants.flatMap((v) => v.images);
          setAllImages([prod.thumbnail, ...variantImages]);
        } else {
          setError("Product not found.");
        }
      } catch (e) {
        console.error("Failed to fetch product", e);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, currentUser]); // Added currentUser dependency

  if (loading) {
    return (
      <PageContainer title="Loading..." description="Loading product details">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Error" description="Error loading product">
        <DashboardCard title="Error">
          <Typography color="error">{error}</Typography>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer title="Not Found" description="Product not found">
        <DashboardCard title="Not Found">
          <Typography>This product could not be found.</Typography>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={product.name}
      description={`Details for ${product.name}`}
    >
      {/* --- BREADCRUMBS START --- */}
      <Box mb={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            href="/dashboard" // Assuming a root dashboard path
            passHref
            style={{ textDecoration: "none" }}
          >
            <Typography color="text.secondary">Master</Typography>
          </Link>
          <Link
            href="/dashboard/master/products" // Assuming this is the product list route
            passHref
            style={{ textDecoration: "none" }}
          >
            <Typography color="text.secondary">Products</Typography>
          </Link>
          <Typography color="text.secondary">
            {product.productId.toUpperCase()}
          </Typography>
          <Typography color="text.primary">View</Typography>
        </Breadcrumbs>
      </Box>
      {/* --- BREADCRUMBS END --- */}

      <DashboardCard title="Product Details">
        <Grid container spacing={3}>
          {/* 1. Image Gallery */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Image
                width={500} // Added explicit larger size
                height={500} // Added explicit larger size
                priority // Mark as priority image
                src={selectedImageUrl || "/placeholder-image.jpg"}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                }}
              />
            </Paper>
            <Box display="flex" gap={1} flexWrap="wrap">
              {allImages.map((img, index) => (
                <Paper
                  key={img.url + index}
                  onClick={() => setSelectedImageUrl(img.url)}
                  sx={{
                    width: 70,
                    height: 70,
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      selectedImageUrl === img.url
                        ? "2px solid"
                        : "2px solid transparent",
                    borderColor: "primary.main",
                    borderRadius: 1,
                  }}
                >
                  <Image
                    src={img.url}
                    width={70} // Explicit size
                    height={70} // Explicit size
                    alt="thumbnail"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Paper>
              ))}
            </Box>
          </Grid>

          {/* 2. Product Info */}
          <Grid item xs={12} md={7}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Item ID: {product.productId.toUpperCase()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Core Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem title="Brand" value={product.brand} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem title="Category" value={product.category} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  title="Status"
                  value={
                    <Chip
                      label={product.status ? "Active" : "Inactive"}
                      color={product.status ? "success" : "default"}
                      icon={product.status ? <IconCheck /> : <IconX />}
                      size="small"
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  title="Listing"
                  value={
                    <Chip
                      label={product.listing ? "Listed" : "Unlisted"}
                      color={product.listing ? "primary" : "default"}
                      size="small"
                    />
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Pricing Details */}
            <Typography variant="h6" gutterBottom>
              Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <DetailItem
                  title="Selling Price"
                  value={`LKR${product.sellingPrice.toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailItem
                  title="Market Price"
                  value={`LKR${product.marketPrice.toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailItem
                  title="Buying Price"
                  value={`LKR${product.buyingPrice.toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailItem title="Discount" value={`${product.discount}%`} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Other Details */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <DetailItem
                  title="Stock"
                  value={
                    <Chip
                      label={
                        product.inStock
                          ? `${product.totalStock} In Stock`
                          : "Out of Stock"
                      }
                      color={product.inStock ? "success" : "error"}
                      variant="outlined"
                    />
                  }
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <DetailItem title="Weight" value={`${product.weight}g`} />
              </Grid>
            </Grid>

            {/* Description */}
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {product.description || "No description provided."}
              </Typography>
            </Box>

            {/* Tags */}
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Search Tags
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {product.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* 3. Variants Table */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Variants ({product.variants.length})
          </Typography>
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Variant Name</TableCell>
                  <TableCell>Variant ID</TableCell>
                  <TableCell>Available Sizes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.variants.length > 0 ? (
                  product.variants.map((variant) => (
                    <TableRow key={variant.variantId}>
                      <TableCell>{variant.variantName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {variant.variantId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {variant.sizes.map((size) => (
                            <Chip key={size} label={size} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No variants have been added for this product.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </DashboardCard>
    </PageContainer>
  );
};

export default ProductViewPage;
"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Breadcrumbs, Link } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/model";
import Image from "next/image";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { PrintOutlined } from "@mui/icons-material";
import { Logo } from "@/assets/images";

const OrderInvoice = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const orderId = params?.orderId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const router = useRouter();

  useEffect(() => {
    if (orderId && currentUser) fetchOrderById();
  }, [orderId, currentUser]);

  const fetchOrderById = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/v1/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Invoice...</Typography>
      </Box>
    );

  if (!order)
    return (
      <Typography sx={{ textAlign: "center", mt: 4 }}>
        Order not found or still loading.
      </Typography>
    );

  return (
    <>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none; }
          }
        `}
      </style>

      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => router.push("/dashboard")}
            sx={{ cursor: "pointer" }}
          >
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => router.push("/dashboard/orders")}
            sx={{ cursor: "pointer" }}
          >
            Orders
          </Link>
          <Typography color="text.primary">
            Invoice #{order?.orderId}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 4 },
          backgroundColor: "grey.50",
          minHeight: "100vh",
        }}
      >
        <Box sx={{ maxWidth: "800px", mx: "auto" }}>
          <Box
            className="no-print"
            sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
          >
            <Button
              variant="contained"
              startIcon={<PrintOutlined />}
              onClick={handlePrint}
            >
              Print Invoice
            </Button>
          </Box>

          <Paper id="printable-area" sx={{ p: { xs: 3, sm: 6 } }}>
            {/* Header */}
            <Grid
              container
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={4}
            >
              <Grid item xs={12} sm={6}>
                <Image alt="Store Logo" src={Logo} width={150} height={150} />
                <Typography variant="h6" gutterBottom>
                  NEVERBE
                </Typography>
                <Typography variant="body2">
                  330/4/10 New Kandy Road, Delgoda
                </Typography>
                <Typography variant="body2">support@neverbe.lk</Typography>
                <Typography variant="body2">+94 70 520 8999</Typography>
                <Typography variant="body2">+94 72 924 9999</Typography>
              </Grid>

              <Grid item xs={12} sm={6} sx={{ textAlign: { sm: "right" } }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  INVOICE
                </Typography>
                <Typography variant="body1">
                  <strong>Order ID:</strong> #{order.orderId}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {order.createdAt}
                </Typography>
                <Typography variant="body1">
                  <strong>Payment:</strong> {order.paymentMethod}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {order.paymentStatus}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Customer Info */}
            <Stack direction="row" justifyContent={"space-between"}>
              <Grid item xs={12} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Bill To:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {order.customer?.name || "N/A"}
                </Typography>
                <Typography variant="body2">
                  {order.customer?.address || "N/A"},{" "}
                  {order.customer?.city || "N/A"}
                </Typography>
                <Typography variant="body2">
                  Postal Code: {order.customer?.zip || "N/A"}
                </Typography>
                <Typography variant="body2">
                  Phone: {order.customer?.phone || "N/A"}
                </Typography>
                <Typography variant="body2">
                  Email: {order.customer?.email || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Ship To:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {order.customer?.shippingName || "N/A"}
                </Typography>
                <Typography variant="body2">
                  {order.customer?.shippingAddress || "N/A"},{" "}
                  {order.customer?.shippingCity || "N/A"}
                </Typography>
                <Typography variant="body2">
                  Postal Code: {order.customer?.shippingZip || "N/A"}
                </Typography>
                <Typography variant="body2">
                  Phone: {order.customer?.shippingPhone || "N/A"}
                </Typography>
              </Grid>
            </Stack>

            {/* Items Table */}
            <TableContainer
              sx={{
                mt: 4,
                border: 1,
                borderColor: "grey.300",
                borderRadius: 1,
              }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: "grey.100" }}>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.variantName}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell align="right">
                        {Number(item.quantity) || 0}
                      </TableCell>
                      <TableCell align="right">
                        Rs. {(Number(item.price) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        Rs. {(Number(item.discount) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        Rs.{" "}
                        {(
                          (Number(item.price) || 0) * (Number(item.quantity) || 0) -
                          (Number(item.discount) || 0) * (Number(item.quantity) || 0)
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
              <Grid item xs={12} sm={5} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>Subtotal:</Typography>
                  <Typography>
                    Rs.{" "}
                    {order.items
                      .reduce(
                        (acc, item) =>
                          acc +
                          (Number(item.price) || 0) * (Number(item.quantity) || 0),
                        0
                      )
                      .toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography>Total Discount:</Typography>
                  <Typography>
                    Rs. {(Number(order?.discount) || 0).toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography>Shipping Fee:</Typography>
                  <Typography>
                    Rs. {(Number(order?.shippingFee) || 0).toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography>Fee:</Typography>
                  <Typography>
                    Rs. {(Number(order?.fee) || 0).toFixed(2)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" fontWeight="bold">
                    Grand Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Rs. {(Number(order?.total) || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ mt: 6, textAlign: "center" }}>
              <Typography variant="body1" gutterBottom>
                Thank you for shopping with NEVERBE!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                www.neverbe.lk
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default OrderInvoice;

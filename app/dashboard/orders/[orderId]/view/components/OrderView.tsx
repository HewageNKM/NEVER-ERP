"use client";

import React, { useEffect, useState } from "react";
import { Breadcrumbs, Link } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  CircularProgress,
  Box,
} from "@mui/material";
import { Order } from "@/model";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { IoCheckmark, IoClose } from "react-icons/io5";

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const { showNotification } = useSnackbar();
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) fetchOrder();
  }, [currentUser]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);
      const token = await getToken();
      const res = await axios.get(`/api/v1/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data || null);
    } catch (error: any) {
      console.error(error);
      showNotification(error?.message || "Failed to fetch order", "error");
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal =
    order?.items?.reduce(
      (sum, item) =>
        sum +
        (item?.quantity || 0) * ((item?.price || 0) - (item?.discount || 0)),
      0
    ) || 0;

  const discount = order?.discount || 0;
  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;
  const transactionFeeCharge = order?.transactionFeeCharge || 0;

  if (loadingOrder) {
    return (
      <Box className="flex justify-center items-center w-full h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        className="mb-4"
      >
        <Link
          underline="hover"
          color="inherit"
          onClick={() => router.push("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => router.push("/dashboard/orders")}
          style={{ cursor: "pointer" }}
        >
          Orders
        </Link>
        <Typography color="text.primary">#{order?.orderId || "—"}</Typography>
        <Typography color="text.primary">View</Typography>
      </Breadcrumbs>

      <Stack spacing={3} marginTop={3}>
        {/* Header */}
        <Stack direction={"row"} spacing={1}>
          <Typography variant="h5" className="font-semibold text-gray-800">
            Order #{order?.orderId || "—"}
          </Typography>
          <Chip
            label={order?.status?.toUpperCase() || "UNKNOWN"}
            color={
              order?.status?.toLowerCase() === "completed"
                ? "success"
                : order?.status?.toLowerCase() === "processing"
                ? "warning"
                : "default"
            }
          />
        </Stack>

        {/* 🧾 Order Summary */}
        <Card variant="outlined" className="shadow-sm border border-gray-100">
          <CardContent>
            <Typography variant="h6" className="font-medium text-gray-800 mb-4">
              Order Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Payment Method:</b>{" "}
                  {`${order?.paymentMethod || "—"} - ${
                    order?.paymentMethodId?.toUpperCase() || "N/A"
                  }`}
                </Typography>
                <Typography>
                  <b>Payment ID:</b> {order?.paymentId || "N/A"}
                </Typography>
                <Typography>
                  <b>Payment Status:</b>{" "}
                  <Chip
                    size="small"
                    label={order?.paymentStatus?.toUpperCase() || "UNKNOWN"}
                    color={
                      order?.paymentStatus?.toLowerCase() === "paid"
                        ? "success"
                        : order?.paymentStatus?.toLowerCase() === "pending"
                        ? "warning"
                        : order?.paymentStatus?.toLowerCase() === "failed"
                        ? "error"
                        : "default"
                    }
                  />
                </Typography>
                <Typography>
                  <b>Integrity:</b>{" "}
                  {order?.integrity ? (
                    <IoCheckmark color="green" size={20} />
                  ) : (
                    <IoClose color="red" size={20} />
                  )}
                </Typography>
                <Typography>
                  <b>From:</b> {order?.from || "—"}
                </Typography>
                <Typography>
                  <b>Stock ID:</b> {order?.stockId || "—"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Created:</b>{" "}
                  {order?.createdAt || "—"}
                </Typography>
                <Typography>
                  <b>Updated:</b>{" "}
                  {order?.updatedAt || "—"}
                </Typography>

                {order?.restocked !== undefined && (
                  <Box marginTop={2}>
                    <Divider className="mb-2" />
                    <Typography
                      variant="subtitle1"
                      className="font-semibold text-gray-700 mb-1"
                    >
                      Restock Info
                    </Typography>
                    <Typography>
                      <b>Restocked:</b>{" "}
                      {order?.restocked ? (
                        <Chip size="small" label="YES" color="success" />
                      ) : (
                        <Chip size="small" label="NO" color="error" />
                      )}
                    </Typography>
                    <Typography>
                      <b>Restocked At:</b>{" "}
                      {order?.restockedAt || "—"}
                    </Typography>
                    <Typography>
                      <b>Cleanup Processed:</b>{" "}
                      {order?.cleanupProcessed ? (
                        <IoCheckmark color="green" size={18} />
                      ) : (
                        <IoClose color="red" size={18} />
                      )}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 👤 Customer Details */}
        {order?.customer && (
          <Card variant="outlined" className="shadow-sm border border-gray-100">
            <CardContent>
              <Typography variant="h6" className="font-medium text-gray-800 mb-3">
                Customer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><b>Name:</b> {order?.customer?.name || "—"}</Typography>
                  <Typography><b>Email:</b> {order?.customer?.email || "—"}</Typography>
                  <Typography><b>Phone:</b> {order?.customer?.phone || "—"}</Typography>
                  <Typography><b>Address:</b> {order?.customer?.address || "—"}</Typography>
                  <Typography><b>City:</b> {order?.customer?.city || "—"}</Typography>
                  <Typography><b>ZIP:</b> {order?.customer?.zip || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><b>Shipping Name:</b> {order?.customer?.shippingName || "—"}</Typography>
                  <Typography><b>Shipping Address:</b> {order?.customer?.shippingAddress || "—"}</Typography>
                  <Typography><b>Shipping City:</b> {order?.customer?.shippingCity || "—"}</Typography>
                  <Typography><b>Shipping ZIP:</b> {order?.customer?.shippingZip || "—"}</Typography>
                  <Typography><b>Shipping Phone:</b> {order?.customer?.shippingPhone || "—"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* 🧮 Items */}
        <Card variant="outlined" className="shadow-sm border border-gray-100">
          <CardContent>
            <Typography variant="h6" className="font-medium text-gray-800 mb-3">
              Items
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order?.items?.map((item, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{item?.name || "—"}</TableCell>
                      <TableCell>{item?.variantName?.toUpperCase() || "—"}</TableCell>
                      <TableCell align="right">{item?.size || "—"}</TableCell>
                      <TableCell align="right">{item?.quantity || 0}</TableCell>
                      <TableCell align="right">
                        Rs.{(item?.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "red", fontWeight: "bold" }}>
                        - Rs.{(item?.discount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        Rs.
                        {(
                          (item?.quantity || 0) *
                          ((item?.price || 0) - (item?.discount || 0))
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals */}
                  <TableRow>
                    <TableCell colSpan={6} align="right">Subtotal</TableCell>
                    <TableCell align="right">Rs.{subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right" sx={{ color: "red" }}>
                      Discount
                    </TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      - Rs.{discount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      Shipping Fee
                    </TableCell>
                    <TableCell align="right">
                      Rs.{shippingFee.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      Other Fee
                    </TableCell>
                    <TableCell align="right">Rs.{fee.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right" className="font-bold">
                      Grand Total
                    </TableCell>
                    <TableCell align="right" className="font-bold text-primary-600">
                      Rs.{(order?.total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right" sx={{ color: "red" }}>
                      Transaction Fee
                    </TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      Rs.{transactionFeeCharge.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      Merchant Total
                    </TableCell>
                    <TableCell align="right">
                      Rs.
                      {(
                        (order?.total || 0) - (order?.transactionFeeCharge || 0)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </motion.div>
  );
};

export default OrderView;

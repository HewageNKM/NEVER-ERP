"use client";

import React, { useState } from "react";
import { Order, Customer } from "@/model";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
  Chip,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { useSnackbar } from "@/contexts/SnackBarContext";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

interface OrderEditFormProps {
  order: Order;
  onRefresh?: () => void; // optional callback to refresh parent data
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onRefresh,
}) => {
  const { showNotification } = useSnackbar();

  const [formData, setFormData] = useState<Order>(order);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showConfirmation } = useConfirmationDialog();

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: event.target.value,
    }));
  };

  const handleOrderStatusChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      status: event.target.value,
    }));
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const currentCustomer = prev.customer || ({} as Customer);
      return {
        ...prev,
        customer: {
          ...currentCustomer,
          [name]: value,
        },
      };
    });
  };

  const handleReset = () => setFormData(order);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    showConfirmation({
      title: "Update Order",
      message:
        order?.integrity === false
          ? "⚠️ This order has been tampered with. Are you absolutely sure you want to proceed with the update?"
          : "Are you sure you want to update this order?",
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
          const token = await getToken();

          await axios.put(`/api/v1/orders/${order.orderId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

          showNotification(
            `Order #${order.orderId} updated successfully.`,
            "success"
          );
          onRefresh?.();
        } catch (error: any) {
          console.error(error);
          showNotification(
            error.response?.data?.message || "Failed to update order",
            "error"
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    if (typeof timestamp === "string")
      return new Date(timestamp).toLocaleString();
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={5}>
        {/* ⚠️ Tampered Order Warning */}
        {order && order.integrity === false && (
          <Box
            sx={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "#b91c1c", fontWeight: 500 }}
            >
              This order has been <b>tampered with</b>. Please review carefully
              before making any changes.
            </Typography>
          </Box>
        )}

        {/* 🧾 Order Summary */}
        <Card variant="outlined" className="shadow-sm border border-gray-100">
          <CardHeader
            title={`Order Summary #${order?.orderId}`}
            subheader="Overview of payment, customer, and order details."
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* Left */}
              <Grid item xs={12} md={6}>
                <Typography>
                  <span className="font-semibold">Payment Method:</span>{" "}
                  {order?.paymentMethod || "—"}{" "}
                  {order?.paymentMethodId &&
                    `(${order.paymentMethodId.toUpperCase()})`}
                </Typography>

                <Typography>
                  <span className="font-semibold">Payment ID:</span>{" "}
                  {order?.paymentId || "—"}
                </Typography>

                <Typography>
                  <span className="font-semibold">Payment Status:</span>{" "}
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
                        : order?.paymentStatus?.toLowerCase() === "refunded"
                        ? "info"
                        : "default"
                    }
                  />
                </Typography>

                <Typography>
                  <span className="font-semibold">Status:</span>{" "}
                  <Chip
                    size="small"
                    label={order?.status?.toUpperCase() || "UNKNOWN"}
                    color={
                      order?.status?.toLowerCase() === "processing"
                        ? "warning"
                        : order?.status?.toLowerCase() === "completed"
                        ? "success"
                        : "default"
                    }
                  />
                </Typography>

                <Typography>
                  <span className="font-semibold">From:</span>{" "}
                  {order?.from || "—"}
                </Typography>

                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <span className="font-semibold">Integrity:</span>
                  {order?.integrity ? (
                    <IoCheckmark color="green" size={20} />
                  ) : (
                    <IoClose color="red" size={20} />
                  )}
                </Typography>
              </Grid>

              {/* Right */}
              <Grid item xs={12} md={6}>
                <Typography>
                  <span className="font-semibold">Order Total:</span>{" "}
                  {(order?.total ?? 0).toFixed(2)} LKR
                </Typography>

                <Typography>
                  <span className="font-semibold">Discount:</span>{" "}
                  {(order?.discount ?? 0).toFixed(2)} LKR
                </Typography>

                <Typography>
                  <span className="font-semibold">Shipping Fee:</span>{" "}
                  {(order?.shippingFee ?? 0).toFixed(2)} LKR
                </Typography>

                <Typography>
                  <span className="font-semibold">Transaction Fee:</span>{" "}
                  {(order?.transactionFeeCharge ?? 0).toFixed(2)} LKR
                </Typography>

                <Typography>
                  <span className="font-semibold">Created:</span>{" "}
                  {formatDate(order?.createdAt)}
                </Typography>

                <Typography>
                  <span className="font-semibold">Updated:</span>{" "}
                  {formatDate(order?.updatedAt)}
                </Typography>
              </Grid>
            </Grid>

            {/* Customer Summary */}
            {order?.customer && (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Customer Summary
                </Typography>
                <Typography>{order.customer.name}</Typography>
                <Typography>{order.customer.phone}</Typography>
                <Typography>{order.customer.email}</Typography>
                <Typography>
                  {order.customer.address}, {order.customer.city}{" "}
                  {order.customer.zip}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ✏️ Edit Form */}
        <Card variant="outlined">
          <CardHeader
            title="Edit Order"
            subheader="Only customer details and payment status can be modified."
          />
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Payment Status */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="paymentStatus-label">Payment Status</InputLabel>
                <Select
                  fullWidth
                  labelId="paymentStatus-label"
                  id="paymentStatus"
                  name="paymentStatus"
                  value={formData?.paymentStatus}
                  label="Payment Status"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                  <MenuItem value="Refunded">Refunded</MenuItem>
                </Select>
              </FormControl>

              {/* Order Status */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="orderStatus-label">Order Status</InputLabel>
                <Select
                  fullWidth
                  labelId="orderStatus-label"
                  id="orderStatus"
                  name="status"
                  value={formData?.status || ""}
                  label="Order Status"
                  onChange={handleOrderStatusChange}
                >
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>

              {/* Customer Details */}
              {formData?.customer && (
                <>
                  {/* Billing */}
                  <div>
                    <Typography variant="h6" gutterBottom>
                      Billing Details
                    </Typography>
                    <Grid container spacing={3}>
                      {[
                        ["name", "Name"],
                        ["phone", "Phone"],
                        ["email", "Email"],
                        ["address", "Address"],
                        ["city", "City"],
                        ["zip", "ZIP Code"],
                      ].map(([field, label]) => (
                        <Grid
                          item
                          xs={12}
                          md={["address", "email"].includes(field) ? 12 : 6}
                          key={field}
                        >
                          <TextField
                            id={field}
                            name={field}
                            label={label}
                            value={(formData.customer as any)?.[field] || ""}
                            onChange={handleCustomerChange}
                            fullWidth
                            type={field === "email" ? "email" : "text"}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </div>

                  {/* Shipping */}
                  <div>
                    <Typography variant="h6" gutterBottom>
                      Shipping Details
                    </Typography>
                    <Grid container spacing={3}>
                      {[
                        ["shippingName", "Name"],
                        ["shippingPhone", "Phone"],
                        ["shippingAddress", "Address"],
                        ["shippingCity", "City"],
                        ["shippingZip", "ZIP Code"],
                      ].map(([field, label]) => (
                        <Grid
                          item
                          xs={12}
                          md={["shippingAddress"].includes(field) ? 12 : 6}
                          key={field}
                        >
                          <TextField
                            id={field}
                            name={field}
                            label={label}
                            value={(formData.customer as any)?.[field] || ""}
                            onChange={handleCustomerChange}
                            fullWidth
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </div>
                </>
              )}
            </Box>
          </CardContent>

          <CardActions sx={{ p: 2, gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <CircularProgress size={22} sx={{ color: "white", mr: 1 }} />
              )}
              Save Changes
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={isSubmitting}
              onClick={handleReset}
            >
              Undo Changes
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </form>
  );
};

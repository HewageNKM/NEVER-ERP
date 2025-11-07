"use client";

import React, { useEffect } from "react";
import {
  Box,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { getOrders, setPage, setSize } from "@/lib/ordersSlice/ordersSlice";
import { IoCheckmark, IoClose, IoRefreshOutline } from "react-icons/io5";
import EmptyState from "@/app/components/EmptyState";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import { useRouter } from "next/navigation";

const OrderTable = () => {
  const { orders, size, selectedPage, isLoading } = useAppSelector(
    (state) => state.ordersSlice
  );
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleView = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}/view`);
  };

  const handleEdit = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  useEffect(() => {
    dispatch(getOrders({ size, page: selectedPage }));
  }, [size, selectedPage]);

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Orders
        </Typography>
        <IconButton
          color="primary"
          onClick={() => dispatch(getOrders({ size, page: selectedPage }))}
        >
          <IoRefreshOutline size={22} />
        </IconButton>
      </Box>

      {isLoading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            overflowX: "auto",
            position: "relative",
          }}
        >
          <Table
            stickyHeader
            sx={{
              "& thead": {
                backgroundColor: "grey.100",
                "& th": {
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textTransform: "uppercase",
                },
              },
              "& tbody tr:hover": {
                backgroundColor: "grey.50",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Integrity</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderId} hover>
                  <TableCell>#{order.orderId}</TableCell>
                  <TableCell>{order.customer?.name || "N/A"}</TableCell>
                  <TableCell>{order.paymentMethod || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus?.toUpperCase() || "UNKNOWN"}
                      color={
                        order.paymentStatus?.toLowerCase() === "paid"
                          ? "success"
                          : order.paymentStatus?.toLowerCase() === "pending"
                          ? "warning"
                          : order.paymentStatus?.toLowerCase() === "failed"
                          ? "error"
                          : order.paymentStatus?.toLowerCase() === "refunded"
                          ? "warning"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>LKR {order.total}</TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell>{order.from}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status?.toUpperCase() || "UNKNOWN"}
                      color={
                        order.status?.toLowerCase() === "processing"
                          ? "warning"
                          : order.status?.toLowerCase() === "complete"
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {order.integrity ? (
                      <IoCheckmark color="green" size={20} />
                    ) : (
                      <IoClose color="red" size={20} />
                    )}
                  </TableCell>
                  <TableCell>{order.createdAt}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          router.push(
                            `/dashboard/orders/${order.orderId}/invoice`
                          )
                        }
                      >
                        Invoice
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleView(order.orderId)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleEdit(order.orderId)}
                      >
                        Edit
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && !isLoading && (
            <EmptyState title="No Orders" subtitle="No orders available." />
          )}
        </TableContainer>
      )}
      {/* Table */}

      {/* Pagination & Page Size */}
      <Box
        mt={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Select
          variant="outlined"
          size="small"
          value={size}
          onChange={(event) =>
            dispatch(setSize(Number.parseInt(event.target.value)))
          }
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
        <Pagination
          count={10}
          variant="outlined"
          shape="rounded"
          page={selectedPage}
          onChange={(event, page) => dispatch(setPage(page))}
        />
      </Box>
    </Stack>
  );
};

export default OrderTable;

"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
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
  TextField,
  Typography,
} from "@mui/material";
import {
  IoCheckmark,
  IoClose,
  IoRefreshOutline,
} from "react-icons/io5";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import DashboardCard from "../components/shared/DashboardCard";
import PageContainer from "../components/container/PageContainer";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { IconClearAll, IconFilter } from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Order } from "@/model";

const paymentStatusList = [
  { id: 1, name: "Paid", value: "Paid" },
  { id: 2, name: "Pending", value: "Pending" },
  { id: 3, name: "Failed", value: "Failed" },
  { id: 4, name: "Refunded", value: "Refunded" },
];

const OrdersPage = () => {
  const router = useRouter();
  const { showNotification } = useSnackbar();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // --- Pagination state ---
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filters (centralized) ---
  const initialFilters = {
    payment: "all",
    status: "all",
    search: "",
    from: null as string | null,
    to: null as string | null,
  };
  const [filters, setFilters] = useState(initialFilters);

  // --- Fetch orders from API ---
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("size", String(size));
      if (filters.payment !== "all") params.append("payment", filters.payment);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.search.trim()) params.append("search", filters.search.trim());

      const token = await getToken();
      const { data } = await axios.get(`/api/v2/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(data.dataList);
      setTotalItems(data.total);
    } catch (err: any) {
      console.error(err);
      showNotification(
        err?.response?.data?.message || "Failed to fetch orders",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Clear all filters ---
  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    fetchOrders();
  };

  // --- Fetch whenever page or size changes ---
  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [page, size, currentUser]);

  return (
    <PageContainer title="Orders" description="Manage all customer orders">
      <DashboardCard title="Orders Management">
        <Stack spacing={3} sx={{ maxWidth: "75vw" }}>
          {/* FILTER SECTION */}
          <Stack spacing={2}>
            {/* Row 1: Search + Filters */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
            >
              {/* Search */}
              <Box display="flex" flex={1} gap={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Order ID..."
                  value={filters.search}
                  inputProps={{
                    pattern:
                      "^\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d+$",
                  }}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </Box>

              {/* Payment Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Payment</InputLabel>
                <Select
                  value={filters.payment}
                  label="Payment"
                  disabled={isLoading}
                  onChange={(e) =>
                    setFilters({ ...filters, payment: e.target.value })
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  {paymentStatusList.map((s) => (
                    <MenuItem key={s.id} value={s.value}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  disabled={isLoading}
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Row 2: Date Range + Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  flexGrow={1}
                >
                  <DatePicker
                    label="From"
                    disabled={isLoading}
                    value={filters.from ? dayjs(filters.from) : null}
                    onChange={(date) =>
                      setFilters({
                        ...filters,
                        from: date ? date.format("YYYY-MM-DD") : null,
                      })
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                  <DatePicker
                    label="To"
                    disabled={isLoading}
                    value={filters.to ? dayjs(filters.to) : null}
                    onChange={(date) =>
                      setFilters({
                        ...filters,
                        to: date ? date.format("YYYY-MM-DD") : null,
                      })
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                </Stack>
              </LocalizationProvider>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  disabled={isLoading}
                  variant="contained"
                  startIcon={<IconFilter size={20} />}
                  color="primary"
                  size="small"
                  onClick={fetchOrders}
                >
                  Filter
                </Button>
                <Button
                  disabled={isLoading}
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<IconClearAll size={20} />}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Stack>

          {/* TABLE SECTION */}
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight={500}>
                Orders ({totalItems})
              </Typography>
              <IconButton color="primary" onClick={fetchOrders}>
                <IoRefreshOutline size={22} />
              </IconButton>
            </Box>

            {isLoading ? (
              <Box textAlign="center" py={5}>
                <CircularProgress />
              </Box>
            ) : orders.length === 0 ? (
              <Typography textAlign="center" color="text.secondary">
                No orders found.
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                sx={{ borderRadius: 2, maxWidth: "71vw" }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Actions</TableCell>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Integrity</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
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
                              onClick={() =>
                                router.push(
                                  `/dashboard/orders/${order.orderId}/view`
                                )
                              }
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() =>
                                router.push(
                                  `/dashboard/orders/${order.orderId}`
                                )
                              }
                            >
                              Edit
                            </Button>
                          </Stack>
                        </TableCell>
                        <TableCell>#{order.orderId}</TableCell>
                        <TableCell>{order.customer?.name || "N/A"}</TableCell>
                        <TableCell>{order.paymentMethod || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              order.paymentStatus?.toUpperCase() || "UNKNOWN"
                            }
                            color={
                              order.paymentStatus?.toLowerCase() === "paid"
                                ? "success"
                                : order.paymentStatus?.toLowerCase() ===
                                  "pending"
                                ? "warning"
                                : order.paymentStatus?.toLowerCase() ===
                                  "failed"
                                ? "error"
                                : order.paymentStatus?.toLowerCase() ===
                                  "refunded"
                                ? "warning"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>LKR {order.total}</TableCell>
                        <TableCell>{order.items?.length || 0}</TableCell>
                        <TableCell>{order.from}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status?.toUpperCase() || "UNKNOWN"}
                            color={
                              order.status?.toLowerCase() === "processing"
                                ? "warning"
                                : order.status?.toLowerCase() === "completed"
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* PAGINATION */}
          <Box
            mt={3}
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
          >
            <Select
              variant="outlined"
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>

            <Pagination
              count={Math.ceil(totalItems / size)}
              variant="outlined"
              shape="rounded"
              page={page}
              onChange={(e, p) => setPage(p)}
            />
          </Box>
        </Stack>
      </DashboardCard>
    </PageContainer>
  );
};

export default OrdersPage;
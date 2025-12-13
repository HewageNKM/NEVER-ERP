"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Breadcrumbs,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  Link as MUILink,
} from "@mui/material";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import * as XLSX from "xlsx";
import PageContainer from "@/app/(secured)/components/container/PageContainer";

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"];

const SalesByPaymentMethod = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const fetchReport = async (evt: any) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-payment-method", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.paymentMethods || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    const formatted = rows.map((r) => ({
      "Payment Method": r.paymentMethod,
      "Total Amount (Rs)": r.totalAmount.toFixed(2),
      "Total Orders": r.totalOrders,
      "Total Transactions": r.transactions,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment Method");
    XLSX.writeFile(wb, "sales_by_payment_method.xlsx");
  };

  return (
    <PageContainer title="Sales by Payment Method">
      <Box mb={2}>
        <Breadcrumbs>
          <MUILink href="/dashboard/reports">Reports</MUILink>
          <Typography>Sales</Typography>
          <Typography color="text.primary">By Payment Method</Typography>
        </Breadcrumbs>
      </Box>

      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Sales by Payment Method
        </Typography>
        <Typography variant="body2">
          Summary of sales grouped by payment method.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <form
            onSubmit={fetchReport}
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <TextField
              required
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
            />
            <TextField
              required
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              size="small"
            />
            <Button variant="contained" type="submit">
              Apply
            </Button>
          </form>

          <Box flexGrow={1} />

          <Button
            variant="contained"
            sx={{ background: "#4CAF50" }}
            onClick={exportExcel}
          >
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* 📊 CHARTS SECTION */}
      {rows.length > 0 && (
        <Stack spacing={3} mb={3}>
          {/* Bar Chart */}
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Total Sales by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <XAxis dataKey="paymentMethod" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalAmount" fill="#2196F3" name="Sales (Rs)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Pie Chart */}
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Order Distribution by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="totalOrders"
                  nameKey="paymentMethod"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* TABLE */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Payment Method</TableCell>
                <TableCell>Total Amount (Rs)</TableCell>
                <TableCell>Total Orders</TableCell>
                <TableCell>Total Transactions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{row.paymentMethod}</TableCell>
                    <TableCell>Rs {row.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{row.totalOrders}</TableCell>
                    <TableCell>{row.transactions}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageContainer>
  );
};

export default SalesByPaymentMethod;

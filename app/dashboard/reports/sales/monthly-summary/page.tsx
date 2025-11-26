"use client";
import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useSnackbar } from "@/contexts/SnackBarContext";

const MAX_MONTHS_RANGE = 12;

const MonthlySummaryPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const { showNotification } = useSnackbar();

  const fetchReport = async (evt: any) => {
    evt.preventDefault();

    if (!from || !to) return;

    const fromDate = new Date(from + "-01");
    const toDate = new Date(to + "-01");
    toDate.setMonth(toDate.getMonth() + 1);
    toDate.setDate(0);
    toDate.setHours(23, 59, 59, 999);

    // check max months
    const monthDiff =
      toDate.getFullYear() * 12 +
      toDate.getMonth() -
      (fromDate.getFullYear() * 12 + fromDate.getMonth()) +
      1;

    if (monthDiff > MAX_MONTHS_RANGE) {
      showNotification(
        `Date range cannot exceed ${MAX_MONTHS_RANGE} months.`,
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/monthly-summary", {
        params: {
          from: fromDate.toISOString().split("T")[0],
          to: toDate.toISOString().split("T")[0],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!summary?.monthly || summary.monthly.length === 0) return;

    const exportData = summary.monthly.map((m: any) => ({
      Month: m.month,
      "Total Orders": m.orders,
      "Total Sales (Rs)": m.sales.toFixed(2),
      "Total Net Sales": m.netSales.toFixed(2),
      "Total COGS (Rs)": (m.cogs || 0).toFixed(2),
      "Total Gross Profit (Rs)": (m.grossProfit || 0).toFixed(2),
      "Gross Profit Margin (%)": (m.grossProfitMargin || 0).toFixed(2),
      "Avg Order Value (Rs)": (m.averageOrderValue || 0).toFixed(2),
      "Shipping (Rs)": m.shipping.toFixed(2),
      "Discount (Rs)": m.discount.toFixed(2),
      "Transaction Fee (Rs)": m.transactionFee.toFixed(2),
      "Items Sold": m.itemsSold,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");
    XLSX.writeFile(wb, `monthly_summary_${from}_${to}.xlsx`);
  };

  return (
    <PageContainer title="Monthly Sales Summary">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Sales</Typography>
          <Typography color="text.primary">Monthly Summary</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Monthly Sales Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter sales by date range to view monthly summary.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <form
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
            onSubmit={fetchReport}
          >
            <TextField
              required
              type="month"
              label="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              required
              type="month"
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              startIcon={<IconFilter size={20} />}
              variant="contained"
              type="submit"
              size="small"
            >
              Apply
            </Button>
          </form>
          <Box flexGrow={1} />
          <Button
            size="small"
            variant="contained"
            sx={{
              backgroundColor: "#4CAF50",
              "&:hover": { backgroundColor: "#45a049" },
            }}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Orders", value: summary.totalOrders },
            {
              label: "Total Sales",
              value: `Rs ${summary.totalSales.toFixed(2)}`,
            },
            {
              label: "Total Net Sales",
              value: `Rs ${summary.totalNetSales.toFixed(2)}`,
            },
            {
              label: "Total COGS",
              value: `Rs ${(summary.totalCOGS || 0).toFixed(2)}`,
            },
            {
              label: "Total Gross Profit",
              value: `Rs ${(summary.totalGrossProfit || 0).toFixed(2)}`,
            },
            {
              label: "Gross Profit Margin",
              value: `${(summary.totalGrossProfitMargin || 0).toFixed(2)}%`,
            },
            {
              label: "Avg Order Value",
              value: `Rs ${(summary.averageOrderValue || 0).toFixed(2)}`,
            },
            {
              label: "Total Shipping",
              value: `Rs ${summary.totalShipping.toFixed(2)}`,
            },
            {
              label: "Total Discount",
              value: `Rs ${summary.totalDiscount.toFixed(2)}`,
            },
            {
              label: "Total Transaction Fee",
              value: `Rs ${summary.totalTransactionFee.toFixed(2)}`,
            },
            { label: "Total Items Sold", value: summary.totalItemsSold },
          ].map((card, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Charts Section */}
      {summary?.monthly && summary.monthly.length > 0 && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Line Chart - Total Sales */}
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Monthly Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Total Sales (Rs)"
                  stroke="#1976d2"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Line Chart - Net Sales */}
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Monthly Net Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="netSales"
                  name="Net Sales (Rs)"
                  stroke="#FF5722"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Bar Chart - Items Sold */}
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Items Sold Per Month
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="itemsSold" name="Items Sold" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* Monthly Summary Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Total Orders</TableCell>
                <TableCell>Total Sales</TableCell>
                <TableCell>Total Net Sales</TableCell>
                <TableCell>COGS</TableCell>
                <TableCell>Gross Profit</TableCell>
                <TableCell>Margin %</TableCell>
                <TableCell>AOV</TableCell>
                <TableCell>Shipping</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Transaction Fee</TableCell>
                <TableCell>Items Sold</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !summary?.monthly || summary.monthly.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                summary.monthly.map((m: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>{m.month}</TableCell>
                    <TableCell>{m.orders}</TableCell>
                    <TableCell>Rs {m.sales.toFixed(2)}</TableCell>
                    <TableCell>Rs {m.netSales.toFixed(2)}</TableCell>
                    <TableCell>Rs {(m.cogs || 0).toFixed(2)}</TableCell>
                    <TableCell>Rs {(m.grossProfit || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {(m.grossProfitMargin || 0).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      Rs {(m.averageOrderValue || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>Rs {m.shipping.toFixed(2)}</TableCell>
                    <TableCell>Rs {m.discount.toFixed(2)}</TableCell>
                    <TableCell>Rs {m.transactionFee.toFixed(2)}</TableCell>
                    <TableCell>{m.itemsSold}</TableCell>
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

export default MonthlySummaryPage;

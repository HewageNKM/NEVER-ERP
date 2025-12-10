"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link as MUILink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface MonthlyRow {
  month?: string;
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

interface SummaryType {
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

const MAX_MONTH_RANGE = 12;

export default function MonthlyRevenuePage() {
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [summary, setSummary] = useState<SummaryType | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const { showNotification } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const getMonthStart = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    return `${y}-${m}-01`;
  };

  const getMonthEnd = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return `${y}-${m}-${lastDay}`;
  };

  const validateRange = () => {
    if (!from || !to) return "Please select From & To months.";

    const start = new Date(getMonthStart(from));
    const end = new Date(getMonthEnd(to));

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Invalid date range.";

    if (start > end) return "From month cannot be after To month.";

    const diffMonths =
      end.getFullYear() * 12 +
      end.getMonth() -
      (start.getFullYear() * 12 + start.getMonth());

    if (diffMonths > MAX_MONTH_RANGE)
      return `Maximum range is ${MAX_MONTH_RANGE} months.`;

    return null;
  };

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();

    const err = validateRange();
    if (err) {
      showNotification(err, "warning");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.get("/api/v2/reports/revenues/monthly-revenue", {
        params: {
          from: getMonthStart(from),
          to: getMonthEnd(to),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows(Array.isArray(res.data?.monthly) ? res.data.monthly : []); // SAFE
      setSummary(res.data?.summary || null);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const safeMoney = (v?: number) => `Rs ${Number(v ?? 0).toFixed(2)}`; // SAFE MONEY FORMAT

  const safePercent = (v?: number) => `${Number(v ?? 0).toFixed(2)}%`; // SAFE PERCENT

  return (
    <PageContainer title="Monthly Revenue">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Revenues</Typography>
          <Typography color="text.primary">Monthly Revenue</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Monthly Revenue Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View monthly revenue, gross profit, and net profit.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <form
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
            onSubmit={fetchReport}
          >
            <TextField
              required
              type="month"
              label="From Month"
              InputLabelProps={{ shrink: true }}
              value={from || ""}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
            />
            <TextField
              required
              type="month"
              label="To Month"
              InputLabelProps={{ shrink: true }}
              value={to || ""}
              onChange={(e) => setTo(e.target.value)}
              size="small"
            />
            <Button
              startIcon={<IconFilter />}
              variant="contained"
              size="small"
              type="submit"
            >
              Apply
            </Button>
          </form>
        </Stack>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Summary Cards */}
      {!loading && summary && (
        <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 2 }}>
          {[
            { label: "Total Orders", value: summary.totalOrders },
            { label: "Total Sales", value: safeMoney(summary.totalSales) },
            { label: "Net Sales", value: safeMoney(summary.totalNetSales) },
            { label: "COGS", value: safeMoney(summary.totalCOGS) },
            {
              label: "Total Discount",
              value: safeMoney(summary.totalDiscount),
            },
            {
              label: "Total Trans. Fee",
              value: safeMoney(summary.totalTransactionFee),
            },
            {
              label: "Total Expenses",
              value: safeMoney(summary.totalExpenses),
            },
            {
              label: "Other Income",
              value: safeMoney(summary.totalOtherIncome),
            },
            { label: "Gross Profit", value: safeMoney(summary.grossProfit) },
            {
              label: "Gross Margin",
              value: safePercent(summary.grossProfitMargin),
            },
            { label: "Net Profit", value: safeMoney(summary.netProfit) },
            {
              label: "Net Margin",
              value: safePercent(summary.netProfitMargin),
            },
          ].map((card) => (
            <Paper
              key={card.label}
              sx={{ flex: "1 1 150px", p: 2, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {card.value === undefined || card.value === null
                  ? "—"
                  : card.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Charts */}
      {!loading && rows.length > 0 && (
        <>
          {/* Line Chart */}
          <Box sx={{ width: "100%", height: 400, mb: 3 }}>
            <ResponsiveContainer>
              <LineChart data={rows.map((r) => ({ ...r }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  name="Total Sales"
                  stroke="#1976d2"
                />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross Profit"
                  stroke="#8884d8"
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Bar Chart */}
          <Box sx={{ width: "100%", height: 400, mb: 3 }}>
            <ResponsiveContainer>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalDiscount"
                  name="Discount"
                  stackId="a"
                  fill="#FF7043"
                />
                <Bar
                  dataKey="totalTransactionFee"
                  name="Transaction Fee"
                  stackId="a"
                  fill="#42A5F5"
                />
                <Bar
                  dataKey="totalExpenses"
                  name="Expenses"
                  stackId="a"
                  fill="#66BB6A"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Total Sales (Rs)</TableCell>
                  <TableCell>Net Sales (Rs)</TableCell>
                  <TableCell>COGS (Rs)</TableCell>
                  <TableCell>Total Discount</TableCell>
                  <TableCell>Total Transaction Fee</TableCell>
                  <TableCell>Total Expenses</TableCell>
                  <TableCell>Other Income</TableCell>
                  <TableCell>Gross Profit</TableCell>
                  <TableCell>Margin %</TableCell>
                  <TableCell>Net Profit</TableCell>
                  <TableCell>Net Margin %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{r.month ?? "—"}</TableCell>
                      <TableCell>{r.totalOrders ?? 0}</TableCell>
                      <TableCell>{safeMoney(r.totalSales)}</TableCell>
                      <TableCell>{safeMoney(r.totalNetSales)}</TableCell>
                      <TableCell>{safeMoney(r.totalCOGS)}</TableCell>
                      <TableCell>{safeMoney(r.totalDiscount)}</TableCell>
                      <TableCell>{safeMoney(r.totalTransactionFee)}</TableCell>
                      <TableCell>{safeMoney(r.totalExpenses)}</TableCell>
                      <TableCell>{safeMoney(r.totalOtherIncome)}</TableCell>
                      <TableCell>{safeMoney(r.grossProfit)}</TableCell>
                      <TableCell>{safePercent(r.grossProfitMargin)}</TableCell>
                      <TableCell>{safeMoney(r.netProfit)}</TableCell>
                      <TableCell>{safePercent(r.netProfitMargin)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[6, 12, 24]}
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}
    </PageContainer>
  );
}

"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useSnackbar } from "@/contexts/SnackBarContext";

interface DailyRevenue {
  date: string;
  totalSales: number;
  totalNetSales: number;
  totalCOGS: number;
  totalOrders: number;
  totalDiscount: number;
  totalTransactionFee: number;
  totalExpenses: number;
  totalOtherIncome: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
}

interface RevenueReport {
  daily: DailyRevenue[];
  summary: Omit<DailyRevenue, "date">;
}
const MAX_RANGE_DAYS = 31;

const DailyRevenuePage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueReport["summary"] | null>(null);
  const { showNotification } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchReport = async (evt: any) => {
    evt.preventDefault();

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

    if (diffDays > MAX_RANGE_DAYS) {
      showNotification(
        `Date range cannot exceed ${MAX_RANGE_DAYS} days.`,
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<RevenueReport>(
        "/api/v2/reports/revenues/daily-revenue",
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReport(res.data.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      showNotification("No data to export", "info");
      return;
    }

    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.totalOrders,
      "Total Sales (Rs)": d.totalSales.toFixed(2),
      "Net Sales (Rs)": d.totalNetSales.toFixed(2),
      "COGS (Rs)": d.totalCOGS.toFixed(2),
      "Total Discount (Rs)": d.totalDiscount.toFixed(2),
      "Total Transaction Fee (Rs)": d.totalTransactionFee.toFixed(2),
      "Total Expenses (Rs)": d.totalExpenses.toFixed(2),
      "Other Income (Rs)": d.totalOtherIncome.toFixed(2),
      "Gross Profit (Rs)": d.grossProfit.toFixed(2),
      "Gross Profit Margin (%)": d.grossProfitMargin.toFixed(2),
      "Net Profit (Rs)": d.netProfit.toFixed(2),
      "Net Profit Margin (%)": d.netProfitMargin.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Revenue");

    XLSX.writeFile(wb, `daily_revenue_${from}_${to}.xlsx`);

    showNotification("Excel exported successfully", "success");
  };

  return (
    <PageContainer title="Daily Revenue Report">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Revenues</Typography>
          <Typography color="text.primary">Daily Revenue</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Daily Revenue Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View daily revenue, gross profit, and net profit within a date range.
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
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
            />
            <TextField
              required
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={to}
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
          <Box flexGrow={1} />
          <Button
            variant="contained"
            color="success"
            size="small"
            sx={{ ml: 2 }}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
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
            { label: "Total Sales", value: summary.totalSales },
            { label: "Net Sales", value: summary.totalNetSales },
            { label: "COGS", value: summary.totalCOGS },
            { label: "Total Discount", value: summary.totalDiscount },
            {
              label: "Total Trans. Fee",
              value: summary.totalTransactionFee,
            },
            { label: "Total Expenses", value: summary.totalExpenses },
            { label: "Other Income", value: summary.totalOtherIncome },
            { label: "Gross Profit", value: summary.grossProfit },
            {
              label: "Gross Margin",
              value: `${summary.grossProfitMargin.toFixed(2)}%`,
              isPercent: true,
            },
            { label: "Net Profit", value: summary.netProfit },
            {
              label: "Net Margin",
              value: `${summary.netProfitMargin.toFixed(2)}%`,
              isPercent: true,
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
                {/* @ts-ignore */}
                {card.isPercent
                  ? card.value
                  : `Rs ${(card.value || 0).toFixed(2)}`}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Charts */}
      {!loading && report.length > 0 && (
        <>
          <Box sx={{ width: "100%", height: 400, mb: 3 }}>
            <ResponsiveContainer>
              <LineChart data={report}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
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
          <Box sx={{ width: "100%", height: 400, mb: 3 }}>
            <ResponsiveContainer>
              <BarChart data={report}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
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

      {/* Table with Frontend Pagination */}
      {!loading && report.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Total Sales (Rs)</TableCell>
                  <TableCell>Net Sales (Rs)</TableCell>
                  <TableCell>COGS (Rs)</TableCell>
                  <TableCell>Total Discount (Rs)</TableCell>
                  <TableCell>Total Transaction Fee (Rs)</TableCell>
                  <TableCell>Total Expenses (Rs)</TableCell>
                  <TableCell>Other Income (Rs)</TableCell>
                  <TableCell>Gross Profit (Rs)</TableCell>
                  <TableCell>Margin %</TableCell>
                  <TableCell>Net Profit (Rs)</TableCell>
                  <TableCell>Net Margin %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((day) => (
                    <TableRow key={day.date} hover>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{day.totalOrders}</TableCell>
                      <TableCell>{day.totalSales.toFixed(2)}</TableCell>
                      <TableCell>{day.totalNetSales.toFixed(2)}</TableCell>
                      <TableCell>{day.totalCOGS.toFixed(2)}</TableCell>
                      <TableCell>{day.totalDiscount.toFixed(2)}</TableCell>
                      <TableCell>
                        {day.totalTransactionFee.toFixed(2)}
                      </TableCell>
                      <TableCell>{day.totalExpenses.toFixed(2)}</TableCell>
                      <TableCell>{day.totalOtherIncome.toFixed(2)}</TableCell>
                      <TableCell>{day.grossProfit.toFixed(2)}</TableCell>
                      <TableCell>{day.grossProfitMargin.toFixed(2)}%</TableCell>
                      <TableCell>{day.netProfit.toFixed(2)}</TableCell>
                      <TableCell>{day.netProfitMargin.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={report.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </PageContainer>
  );
};

export default DailyRevenuePage;

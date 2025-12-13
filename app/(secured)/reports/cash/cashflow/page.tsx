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
import PageContainer from "@/app/(secured)/components/container/PageContainer";
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

interface DailyCashFlow {
  date: string;
  orders: number;
  cashIn: number;
  transactionFees: number;
  expenses: number;
  netCashFlow: number;
  daily: DailyCashFlow[];
}

interface CashFlowSummary {
  totalOrders: number;
  totalCashIn: number;
  totalTransactionFees: number;
  totalExpenses: number;
  totalNetCashFlow: number;
  daily: DailyCashFlow[];
}

interface CashFlowReport {
  summary: CashFlowSummary;
}
const MAX_RANGE_DAYS = 31;

const CashFlowPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyCashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowReport["summary"] | null>(
    null
  );
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
      const res = await axios.get<CashFlowReport>(
        "/api/v2/reports/cash/cashflow",
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReport(res.data.summary.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch report", "error");
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
      "Total Orders": d.orders,
      "Cash In (Rs)": d.cashIn.toFixed(2),
      "Transaction Fees (Rs)": d.transactionFees.toFixed(2),
      "Expenses (Rs)": d.expenses.toFixed(2),
      "Net Cash Flow (Rs)": d.netCashFlow.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");

    XLSX.writeFile(wb, `cashflow_${from}_${to}.xlsx`);

    showNotification("Excel exported successfully", "success");
  };

  return (
    <PageContainer title="Cashflow Report">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Cash</Typography>
          <Typography color="text.primary">Cashflow</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Cashflow Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View cash in, transaction fees, and net cash flow within a date range.
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
            { label: "Total Cash In", value: summary.totalCashIn },
            {
              label: "Total Transaction Fees",
              value: summary.totalTransactionFees,
            },
            { label: "Total Expenses", value: summary.totalExpenses },
            { label: "Net Cash Flow", value: summary.totalNetCashFlow },
          ].map((card) => (
            <Paper
              key={card.label}
              sx={{ flex: "1 1 200px", p: 2, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {card.label === "Total Orders"
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
                  dataKey="cashIn"
                  name="Cash In"
                  stroke="#1976d2"
                />
                <Line
                  type="monotone"
                  dataKey="netCashFlow"
                  name="Net Cash Flow"
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
                  dataKey="transactionFees"
                  name="Transaction Fees"
                  fill="#FF7043"
                />
                <Bar dataKey="expenses" name="Expenses" fill="#FFCA28" />
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
                  <TableCell>Cash In (Rs)</TableCell>
                  <TableCell>Transaction Fees (Rs)</TableCell>
                  <TableCell>Expenses (Rs)</TableCell>
                  <TableCell>Net Cash Flow (Rs)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((day) => (
                    <TableRow key={day.date} hover>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{day.orders}</TableCell>
                      <TableCell>{day.cashIn.toFixed(2)}</TableCell>
                      <TableCell>{day.transactionFees.toFixed(2)}</TableCell>
                      <TableCell>{day.expenses.toFixed(2)}</TableCell>
                      <TableCell>{day.netCashFlow.toFixed(2)}</TableCell>
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

export default CashFlowPage;

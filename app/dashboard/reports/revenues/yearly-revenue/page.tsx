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
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import axios from "axios";

const YearRevenuePage = () => {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [yearly, setYearly] = useState<any[]>([]);

  const fetchReport = async (evt: any) => {
    evt.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = await getToken();
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await axios.get("/api/v2/reports/revenues/yearly-revenue", {
        params: { from: fromDate, to: toDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
      setYearly(res.data.yearly || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!summary?.yearly?.length) return;

    const exportData: any[] = [];
    summary.yearly.forEach((y: any) => {
      exportData.push({
        Year: y.year,
        "Total Orders": y.totalOrders,
        "Total Discount (Rs)": y.totalDiscount.toFixed(2),
        "Transaction Fee (Rs)": y.totalTransactionFee.toFixed(2),
        "Total Expenses (Rs)": y.totalExpenses.toFixed(2),
        "Gross Profit (Rs)": y.grossProfit.toFixed(2),
        "Net Profit (Rs)": y.netProfit.toFixed(2),
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Revenue");
    XLSX.writeFile(wb, `yearly_revenue_${from}_${to}.xlsx`);
  };

  return (
    <PageContainer title="Yearly Revenue Report">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Revenues</Typography>
          <Typography color="text.primary">Yearly Report</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Yearly Revenue Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select year range to view yearly revenue, gross/net profit, and items sold.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <form style={{ display: "flex", gap: "10px", flexWrap: "wrap" }} onSubmit={fetchReport}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                views={["year"]}
                label="From Year"
                value={from ? new Date(Number(from), 0, 1) : null}
                onChange={(newValue) => newValue && setFrom(String(newValue.getFullYear()))}
                renderInput={(params) => <TextField {...params} size="small" required />}
              />
              <DatePicker
                views={["year"]}
                label="To Year"
                value={to ? new Date(Number(to), 0, 1) : null}
                onChange={(newValue) => newValue && setTo(String(newValue.getFullYear()))}
                renderInput={(params) => <TextField {...params} size="small" required />}
              />
            </LocalizationProvider>

            <Button startIcon={<IconFilter size={20} />} variant="contained" type="submit" size="small">
              Apply
            </Button>
          </form>

          <Box flexGrow={1} />

          <Button
            variant="contained"
            sx={{ backgroundColor: "#4CAF50", "&:hover": { backgroundColor: "#45a049" } }}
            onClick={handleExportExcel}
            size="small"
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
            { label: "Total Discount", value: `Rs ${summary.totalDiscount.toFixed(2)}` },
            { label: "Transaction Fee", value: `Rs ${summary.totalTransactionFee.toFixed(2)}` },
            { label: "Total Expenses", value: `Rs ${summary.totalExpenses.toFixed(2)}` },
            { label: "Gross Profit", value: `Rs ${summary.grossProfit.toFixed(2)}` },
            { label: "Net Profit", value: `Rs ${summary.netProfit.toFixed(2)}` },
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

      {/* Charts */}
      {yearly?.length > 0 && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Gross & Net Profit Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="grossProfit" name="Gross Profit (Rs)" stroke="#1976d2" />
                <Line type="monotone" dataKey="netProfit" name="Net Profit (Rs)" stroke="#FF5722" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Orders Per Year
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalOrders" name="Total Orders" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* Yearly Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Total Orders</TableCell>
                <TableCell>Total Discount</TableCell>
                <TableCell>Transaction Fee</TableCell>
                <TableCell>Total Expenses</TableCell>
                <TableCell>Gross Profit</TableCell>
                <TableCell>Net Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !yearly?.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                yearly.map((y: any) => (
                  <TableRow key={y.year} hover>
                    <TableCell>{y.year}</TableCell>
                    <TableCell>{y.totalOrders}</TableCell>
                    <TableCell>Rs {y.totalDiscount.toFixed(2)}</TableCell>
                    <TableCell>Rs {y.totalTransactionFee.toFixed(2)}</TableCell>
                    <TableCell>Rs {y.totalExpenses.toFixed(2)}</TableCell>
                    <TableCell>Rs {y.grossProfit.toFixed(2)}</TableCell>
                    <TableCell>Rs {y.netProfit.toFixed(2)}</TableCell>
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

export default YearRevenuePage;

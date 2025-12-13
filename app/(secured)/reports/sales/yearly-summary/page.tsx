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
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";

const Page = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchReport = async (evt: any) => {
    evt.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = await getToken();
      // Convert to full date strings for the API
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await axios.get("/api/v2/reports/sales/yearly-summary", {
        params: { from: fromDate, to: toDate },
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
    if (!summary?.yearly || summary.yearly.length === 0) return;

    const exportData: any[] = [];
    summary.yearly.forEach((y: any) => {
      exportData.push({
        Year: y.year,
        "Total Orders": y.orders,
        "Total Sales (Rs)": y.sales.toFixed(2),
        "Total Net Sales": y.netSales.toFixed(2),
        "Total COGS (Rs)": (y.cogs || 0).toFixed(2),
        "Total Gross Profit (Rs)": (y.grossProfit || 0).toFixed(2),
        "Gross Profit Margin (%)": (y.grossProfitMargin || 0).toFixed(2),
        "Avg Order Value (Rs)": (y.averageOrderValue || 0).toFixed(2),
        "Shipping (Rs)": y.shipping.toFixed(2),
        "Discount (Rs)": y.discount.toFixed(2),
        "Transaction Fee (Rs)": y.transactionFee.toFixed(2),
        "Items Sold": y.itemsSold,
      });
      y.monthly.forEach((m: any) => {
        exportData.push({
          Year: y.year,
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
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Summary");
    XLSX.writeFile(wb, `yearly_summary_${from}_${to}.xlsx`);
  };

  return (
    <PageContainer title="Yearly Sales Report">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Sales</Typography>
          <Typography color="text.primary">Yearly Summary</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Yearly Sales Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter sales by year range to view yearly and monthly summaries.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <form
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
            onSubmit={fetchReport}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                views={["year"]}
                label="From Year"
                value={from ? new Date(Number(from), 0, 1) : null}
                onChange={(newValue) =>
                  newValue && setFrom(String(newValue.getFullYear()))
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" required />
                )}
              />
              <DatePicker
                views={["year"]}
                label="To Year"
                value={to ? new Date(Number(to), 0, 1) : null}
                onChange={(newValue) =>
                  newValue && setTo(String(newValue.getFullYear()))
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" required />
                )}
              />
            </LocalizationProvider>

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
            variant="contained"
            sx={{
              backgroundColor: "#4CAF50",
              "&:hover": { backgroundColor: "#45a049" },
            }}
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

      {/* Charts */}
      {summary?.yearly?.length > 0 && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Yearly Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
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

          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Yearly Net Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
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

          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" mb={2}>
              Items Sold Per Year
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="itemsSold" name="Items Sold" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* Yearly & Monthly Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
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
                  <TableCell colSpan={11} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !summary?.yearly?.length ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                summary.yearly.map((y: any) => (
                  <React.Fragment key={y.year}>
                    <TableRow hover sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>{y.year}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{y.orders}</TableCell>
                      <TableCell>Rs {y.sales.toFixed(2)}</TableCell>
                      <TableCell>Rs {y.netSales.toFixed(2)}</TableCell>
                      <TableCell>Rs {(y.cogs || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        Rs {(y.grossProfit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {(y.grossProfitMargin || 0).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        Rs {(y.averageOrderValue || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>Rs {y.shipping.toFixed(2)}</TableCell>
                      <TableCell>Rs {y.discount.toFixed(2)}</TableCell>
                      <TableCell>Rs {y.transactionFee.toFixed(2)}</TableCell>
                      <TableCell>{y.itemsSold}</TableCell>
                    </TableRow>
                    {y.monthly.map((m: any) => (
                      <TableRow key={m.month} hover>
                        <TableCell>{y.year}</TableCell>
                        <TableCell>{m.month}</TableCell>
                        <TableCell>{m.orders}</TableCell>
                        <TableCell>Rs {m.sales.toFixed(2)}</TableCell>
                        <TableCell>Rs {m.netSales.toFixed(2)}</TableCell>
                        <TableCell>Rs {(m.cogs || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          Rs {(m.grossProfit || 0).toFixed(2)}
                        </TableCell>
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
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageContainer>
  );
};

export default Page;

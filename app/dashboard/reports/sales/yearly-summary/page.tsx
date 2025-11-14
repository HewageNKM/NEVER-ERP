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

const Page = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchReport = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/yearly-summary", {
        params: { from, to },
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
          <Typography color="text.primary">Monthly Summary</Typography>
        </Breadcrumbs>
      </Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Yearly Sales Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter sales by date range to view yearly and monthly summaries.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            type="date"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="small"
          />
          <TextField
            type="date"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="small"
          />

          <Button
            startIcon={<IconFilter size={20} />}
            variant="contained"
            onClick={fetchReport}
            size="small"
          >
            Apply
          </Button>

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

      {/* Main Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Orders", value: summary.totalOrders },
            {
              label: "Total Sales",
              value: `Rs ${summary.totalSales.toFixed(2)}`,
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
                <TableCell>Shipping</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Transaction Fee</TableCell>
                <TableCell>Items Sold</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !summary?.yearly || summary.yearly.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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

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
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import * as XLSX from "xlsx";

const MonthlySummaryPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchReport = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/monthly-summary", {
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
    if (!summary?.monthly || summary.monthly.length === 0) return;

    const exportData = summary.monthly.map((m: any) => ({
      Month: m.month,
      "Total Orders": m.orders,
      "Total Sales (Rs)": m.sales.toFixed(2),
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Monthly Sales Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter sales by date range to view monthly summary.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            type="date"
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
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

      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
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
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !summary?.monthly || summary.monthly.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                summary.monthly.map((m: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>{m.month}</TableCell>
                    <TableCell>{m.orders}</TableCell>
                    <TableCell>Rs {m.sales.toFixed(2)}</TableCell>
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

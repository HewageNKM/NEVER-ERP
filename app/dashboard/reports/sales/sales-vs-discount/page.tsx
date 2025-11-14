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
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";

const SalesVsDiscountPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/sales-vs-discount", {
        params: { from, to, groupBy },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data.report || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!report.length) return;
    const exportData = report.map((r) => ({
      Period: r.period,
      "Total Sales (Rs)": r.totalSales.toFixed(2),
      "Total Discount (Rs)": r.totalDiscount.toFixed(2),
      "Total Orders": r.totalOrders,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales vs Discount");
    XLSX.writeFile(wb, `sales_vs_discount_${from || "all"}_${to || "all"}.xlsx`);
  };

  return (
    <PageContainer title="Sales vs Discount">
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Sales</Typography>
          <Typography color="text.primary">Sales vs Discount</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Sales vs Discount
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compare total sales and discounts over time.
        </Typography>
      </Box>

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
          <TextField
            select
            label="Group By"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as "day" | "month")}
            SelectProps={{ native: true }}
            size="small"
            sx={{ width: 120 }}
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
          </TextField>
          <Button
            startIcon={<IconFilter />}
            variant="contained"
            onClick={fetchReport}
            size="small"
          >
            Apply
          </Button>
          <Box flexGrow={1} />
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4CAF50", "&:hover": { backgroundColor: "#45a049" } }}
            onClick={exportExcel}
            size="small"
          >
            Export Excel
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Total Sales (Rs)</TableCell>
                <TableCell>Total Discount (Rs)</TableCell>
                <TableCell>Total Orders</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : report.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                report.map((r, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{r.period}</TableCell>
                    <TableCell>Rs {r.totalSales.toFixed(2)}</TableCell>
                    <TableCell>Rs {r.totalDiscount.toFixed(2)}</TableCell>
                    <TableCell>{r.totalOrders}</TableCell>
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

export default SalesVsDiscountPage;

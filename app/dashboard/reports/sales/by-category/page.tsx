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

const SalesByCategoryPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-category", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!categories.length) return;

    const exportData = categories.map((c) => ({
      Category: c.category,
      "Total Orders": c.totalOrders,
      "Total Quantity Sold": c.totalQuantity,
      "Total Sales (Rs)": c.totalSales.toFixed(2),
      "Total Discount (Rs)": c.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales by Category");
    XLSX.writeFile(
      wb,
      `sales_by_category_${from || "all"}_${to || "all"}.xlsx`
    );
  };

  return (
    <PageContainer title="Sales by Category">
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
          Sales by Category
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View sales totals aggregated by product category.
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
            sx={{
              backgroundColor: "#4CAF50",
              "&:hover": { backgroundColor: "#45a049" },
            }}
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
                <TableCell>Category</TableCell>
                <TableCell>Total Orders</TableCell>
                <TableCell>Total Quantity Sold</TableCell>
                <TableCell>Total Sales (Rs)</TableCell>
                <TableCell>Total Discount (Rs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{c.category}</TableCell>
                    <TableCell>{c.totalOrders}</TableCell>
                    <TableCell>{c.totalQuantity}</TableCell>
                    <TableCell>Rs {(c.totalSales || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      Rs {(c.totalDiscount || 0).toFixed(2)}
                    </TableCell>
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

export default SalesByCategoryPage;

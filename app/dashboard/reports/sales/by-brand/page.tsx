"use client";
import React, { useEffect, useState } from "react";
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
  TablePagination,
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import { IconFilter } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import axios from "axios";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";

// 📊 Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSnackbar } from "@/contexts/SnackBarContext";

const COLORS = ["#1976d2", "#2e7d32", "#ed6c02", "#d32f2f"];

const SalesByBrandPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBrands, setTotalBrands] = useState(0);

  const fetchReport = async (evt: any) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-brand", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });

      setBrands(res.data.brands || []);
      setTotalBrands(res.data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) =>
    setPage(newPage);

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const exportExcel = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-brand", {
        params: { from, to, page: 1, size: totalBrands || 1000 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const allBrands = res.data.brands || [];
      if (!allBrands.length) return;

      const exportData = allBrands.map((b) => ({
        Brand: b.brand,
        "Total Quantity Sold": b.totalQuantity,
        "Total Sales (Rs)": b.totalSales.toFixed(2),
        "Total Net Sale": b.totalNetSales.toFixed(2),
        "Total COGS (Rs)": (b.totalCOGS || 0).toFixed(2),
        "Total Profit (Rs)": (b.totalGrossProfit || 0).toFixed(2),
        "Margin (%)": (b.grossProfitMargin || 0).toFixed(2),
        "Total Discount (Rs)": b.totalDiscount.toFixed(2),
        "Total Orders": b.totalOrders,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales by Brand");
      XLSX.writeFile(wb, `sales_by_brand_${from || "all"}_${to || "all"}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <PageContainer title="Sales by Brand">
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Sales</Typography>
          <Typography color="text.primary">By Brand</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Sales by Brand
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View total sales by brand and export data.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <form
            onSubmit={fetchReport}
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
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
            onClick={exportExcel}
            size="small"
          >
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* 📊 CHARTS */}
      {brands.length > 0 && (
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Sales Comparison (Bar Chart)
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={brands}>
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSales" name="Total Sales" fill="#1976d2" />
                <Bar dataKey="totalNetSales" name="Net Sale" fill="#2e7d32" />
                <Bar dataKey="totalDiscount" name="Discount" fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Quantity Distribution (Pie Chart)
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={brands}
                  dataKey="totalQuantity"
                  nameKey="brand"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {brands.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}

      {/* TABLE */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell>Total Quantity Sold</TableCell>
                <TableCell>Total Sales (Rs)</TableCell>
                <TableCell>Total Net Sale(Rs)</TableCell>
                <TableCell>Total COGS (Rs)</TableCell>
                <TableCell>Total Profit (Rs)</TableCell>
                <TableCell>Margin (%)</TableCell>
                <TableCell>Total Discount (Rs)</TableCell>
                <TableCell>Total Orders</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                brands.map((b, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{b.brand}</TableCell>
                    <TableCell>{b.totalQuantity}</TableCell>
                    <TableCell>Rs {(b.totalSales || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      Rs {(b.totalNetSales || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>Rs {(b.totalCOGS || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      Rs {(b.totalGrossProfit || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {(b.grossProfitMargin || 0).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      Rs {(b.totalDiscount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{b.totalOrders}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={totalBrands}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </PageContainer>
  );
};

export default SalesByBrandPage;

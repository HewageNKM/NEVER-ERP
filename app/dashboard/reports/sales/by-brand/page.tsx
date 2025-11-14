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
  TablePagination,
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import { IconFilter } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import axios from "axios";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";

const SalesByBrandPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBrands, setTotalBrands] = useState(0);

  const fetchReport = async (pageNum = 1, size = rowsPerPage) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-brand", {
        params: { from, to, page: pageNum, size },
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

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
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
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="inherit">Sales</Typography>
          <Typography color="text.primary">By Brand</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Sales by Brand</Typography>
        <Typography variant="body2" color="text.secondary">
          View total sales by brand and export data.
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
          <Button startIcon={<IconFilter />} variant="contained" onClick={() => fetchReport(1, rowsPerPage)} size="small">
            Apply
          </Button>
          <Box flexGrow={1} />
          <Button variant="contained" sx={{ backgroundColor: "#4CAF50", "&:hover": { backgroundColor: "#45a049" }}} onClick={exportExcel} size="small">
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell>Total Quantity Sold</TableCell>
                <TableCell>Total Sales (Rs)</TableCell>
                <TableCell>Total Discount (Rs)</TableCell>
                <TableCell>Total Orders</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell>
                </TableRow>
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No data</TableCell>
                </TableRow>
              ) : (
                brands.map((b, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{b.brand}</TableCell>
                    <TableCell>{b.totalQuantity}</TableCell>
                    <TableCell>Rs {(b.totalSales || 0).toFixed(2)}</TableCell>
                    <TableCell>Rs {(b.totalDiscount || 0).toFixed(2)}</TableCell>
                    <TableCell>{b.totalOrders}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
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

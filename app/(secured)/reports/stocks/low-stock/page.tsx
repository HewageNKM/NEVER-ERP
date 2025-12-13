"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  TablePagination,
  Breadcrumbs,
  Link as MUILink,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";

const LowStockPage = () => {
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState("all");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });

  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Fetch stock dropdown
  const fetchStocksDropdown = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/master/stocks/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStocksDropdown([{ id: "all", label: "All Stocks" }, ...(res.data || [])]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all low-stock items at once
  const fetchStock = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/stocks/low-stock", {
        params: { threshold, stockId: selectedStock },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.stock || [];
      setStock(data);

      setSummary({
        totalProducts: data.length,
        totalQuantity: data.reduce((sum, s) => sum + s.quantity, 0),
        totalValuation: data.reduce((sum, s) => sum + (s.buyingPrice || 0) * s.quantity, 0),
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) fetchStocksDropdown();
  }, [currentUser]);

  const handleApply = () => {
    setPage(0);
    fetchStock();
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportExcel = () => {
    if (!stock.length) return;
    const data = stock.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock ID": s.stockId,
      "Stock Name": s.stockName,
      Quantity: s.quantity,
      Threshold: s.threshold,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Low Stock");
    XLSX.writeFile(wb, "low_stock.xlsx");
  };

  // Frontend pagination: visible rows
  const visibleRows = stock.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageContainer title="Low Stock">
      {/* Breadcrumb */}
      <Box mb={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography>Stocks</Typography>
          <Typography color="text.primary">Low Stock</Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Title */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Low Stock Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Products and variants with stock below threshold.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Stock Threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            size="small"
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="stock-select-label">Select Stock</InputLabel>
            <Select
              labelId="stock-select-label"
              value={selectedStock}
              label="Select Stock"
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {stocksDropdown.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleApply}>
            Apply
          </Button>
          <Box flexGrow={1} />
          <Button variant="contained" sx={{ backgroundColor: "#4CAF50" }} onClick={exportExcel}>
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* Summary */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Products
                </Typography>
                <Typography variant="h6">{summary.totalProducts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography variant="h6">{summary.totalQuantity}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Valuation (Rs)
                </Typography>
                <Typography variant="h6">
                  Rs {summary.totalValuation.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Product ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Variant ID</TableCell>
                <TableCell>Variant Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Stock ID</TableCell>
                <TableCell>Stock Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Threshold</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No low stock items
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((s, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{s.productId}</TableCell>
                    <TableCell>{s.productName}</TableCell>
                    <TableCell>{s.variantId}</TableCell>
                    <TableCell>{s.variantName}</TableCell>
                    <TableCell>{s.size}</TableCell>
                    <TableCell>{s.stockId}</TableCell>
                    <TableCell>{s.stockName}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>{s.threshold}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={stock.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>
    </PageContainer>
  );
};

export default LowStockPage;

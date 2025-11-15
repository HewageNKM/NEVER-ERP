"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link as MUILink,
  Card,
  CardContent,
  Grid,
  TablePagination,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";

const StockValuationPage = () => {
  const [loading, setLoading] = useState(false);
  const [stockList, setStockList] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch stock options for dropdown
  const fetchStocksDropdown = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/master/stocks/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStocksDropdown(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockValuation = async (stockId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/stocks/valuation", {
        params: { stockId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStockList(res.data.stock || []);
      setSummary(
        res.data.summary || { totalProducts: 0, totalQuantity: 0, totalValuation: 0 }
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) fetchStocksDropdown();
  }, [currentUser]);

  const handleStockChange = (event: any) => {
    const stockId = event.target.value;
    setSelectedStock(stockId);
    setPage(0);
  };

  const handleApply = () => {
    fetchStockValuation(selectedStock);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportExcel = () => {
    if (!stockList.length) return;
    const data = stockList.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock ID": s.stockId,
      "Stock Name": s.stockName,
      Quantity: s.quantity,
      "Buying Price (Rs)": s.buyingPrice.toFixed(2),
      "Valuation (Rs)": s.valuation.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Valuation");
    XLSX.writeFile(wb, `stock_valuation.xlsx`);
  };

  // Calculate visible rows for frontend pagination
  const visibleRows = stockList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageContainer title="Stock Valuation">
      <Box mb={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography>Stocks</Typography>
          <Typography color="text.primary">Stock Valuation</Typography>
        </Breadcrumbs>
      </Box>

      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Stock Valuation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Shows the current stock value per product/variant based on buying price.
        </Typography>
      </Box>

      <Box mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="stock-select-label">Select Stock</InputLabel>
            <Select
              labelId="stock-select-label"
              value={selectedStock}
              label="Select Stock"
              onChange={handleStockChange}
            >
              <MenuItem value="all">All Stocks</MenuItem>
              {stocksDropdown.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#2196F3" }}
            onClick={handleApply}
          >
            Apply
          </Button>
          <Box flexGrow={1} />
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4CAF50" }}
            onClick={exportExcel}
          >
            Export Excel
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
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
                <TableCell>Buying Price (Rs)</TableCell>
                <TableCell>Valuation (Rs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No data available
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
                    <TableCell>Rs {s.buyingPrice.toFixed(2)}</TableCell>
                    <TableCell>Rs {s.valuation.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={stockList.length}
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

export default StockValuationPage;

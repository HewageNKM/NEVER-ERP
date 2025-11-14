"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import PageContainer from "@/app/dashboard/components/container/PageContainer";
import { getToken } from "@/firebase/firebaseClient";

const LiveStockPage = () => {
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchStock = async (pageNum = 1, size = rowsPerPage) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/stocks/live-stock", {
        params: { page: pageNum, size },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStock(res.data.stock || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Live Stock");
    XLSX.writeFile(wb, `live_stock_page_${page + 1}.xlsx`);
  };

  return (
    <PageContainer title="Live Stock">
      <Box mb={2}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink color="inherit" href="/dashboard/reports">
            Reports
          </MUILink>
          <Typography color="text.primary">Live Stock</Typography>
        </Breadcrumbs>
      </Box>

      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Live Stock
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current inventory levels with product and variant details.
        </Typography>
      </Box>

      {/* Manual Fetch Button */}
      <Box mb={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="contained"
            onClick={() => fetchStock(page + 1, rowsPerPage)}
          >
            Fetch Stock
          </Button>
        </Stack>
        <Box flexGrow={1} />
        <Box mt={2}>
          <Button
            variant="contained"
            onClick={exportExcel}
            sx={{
              backgroundColor: "#4CAF50",
              "&:hover": { backgroundColor: "#45a049" },
            }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No stock data available
                  </TableCell>
                </TableRow>
              ) : (
                stock.map((s, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{s.productId}</TableCell>
                    <TableCell>{s.productName}</TableCell>
                    <TableCell>{s.variantId}</TableCell>
                    <TableCell>{s.variantName}</TableCell>
                    <TableCell>{s.size}</TableCell>
                    <TableCell>{s.stockId}</TableCell>
                    <TableCell>{s.stockName}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>
    </PageContainer>
  );
};

export default LiveStockPage;

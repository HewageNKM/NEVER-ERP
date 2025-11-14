"use client";
import React, { useState, useEffect } from "react";
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
  Link as MUILink,
  Breadcrumbs,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/dashboard/components/container/PageContainer";

const TopSellingProductsPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0); // MUI uses zero-indexed page
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchReport = async (pageNum = 1, size = rowsPerPage) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/top-products", {
        params: { from, to, page: pageNum, size },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.topProducts || []);
      setTotalProducts(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page changes
  useEffect(() => {
    fetchReport(page + 1, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    fetchReport(newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSize = parseInt(event.target.value, 10);
    setRowsPerPage(newSize);
    setPage(0);
    fetchReport(1, newSize);
  };

  const exportExcel = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/top-products", {
        params: { from, to, page: 1, size: totalProducts || 1000 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const allProducts = res.data.topProducts || [];
      if (!allProducts.length) return;

      const exportData = allProducts.map((p) => ({
        "Product ID": p.productId,
        Name: p.name,
        "Variant Name": p.variantName,
        "Total Quantity Sold": p.totalQuantity,
        "Total Sales (Rs)": p.totalSales.toFixed(2),
        "Total Discount (Rs)": p.totalDiscount.toFixed(2),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Top Selling Products");
      XLSX.writeFile(
        wb,
        `top_selling_products_${from || "all"}_${to || "all"}.xlsx`
      );
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <PageContainer title="Top Selling Products">
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
          Top Selling Products
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View most sold products and export data.
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
            startIcon={<IconFilter />}
            variant="contained"
            onClick={() => {
              setPage(0);
              fetchReport(1, rowsPerPage);
            }}
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

      {/* Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Product ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell>Total Quantity Sold</TableCell>
                <TableCell>Total Sales (Rs)</TableCell>
                <TableCell>Total Discount (Rs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{p.productId.toUpperCase()}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.variantName}</TableCell>
                    <TableCell>{p.totalQuantity}</TableCell>
                    <TableCell>Rs {(p.totalSales || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      Rs {(p.totalDiscount || 0).toFixed(2)}
                    </TableCell>
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
          count={totalProducts}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </PageContainer>
  );
};

export default TopSellingProductsPage;

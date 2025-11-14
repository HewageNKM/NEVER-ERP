"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Breadcrumbs,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  Link as MUILink,
} from "@mui/material";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import * as XLSX from "xlsx";
import PageContainer from "@/app/dashboard/components/container/PageContainer";

const RefundsReturnsReport = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/refunds-returns", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    if (!report?.items?.length) return;

    const formatted = report.items.map((o: any) => ({
      "Order ID": o.orderId,
      Status: o.status,
      "Refund Amount (Rs)": o.refundAmount,
      Restocked: o.restocked ? "Yes" : "No",
      "Restocked At": o.restockedAt || "-",
      "Created At": o.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refunds & Returns");
    XLSX.writeFile(wb, "refunds_returns.xlsx");
  };

  return (
    <PageContainer title="Refunds & Returns">
      {/* Breadcrumb */}
      <Box mb={2}>
        <Breadcrumbs>
          <MUILink href="/dashboard/reports">Reports</MUILink>
          <Typography>Sales</Typography>
          <Typography color="text.primary">Refunds & Returns</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Refunds & Returns
        </Typography>
        <Typography variant="body2">
          Summary of refunded and returned orders.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="From"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="small"
          />
          <TextField
            label="To"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="small"
          />

          <Button variant="contained" onClick={fetchReport}>
            Apply
          </Button>

          <Box flexGrow={1} />

          <Button
            variant="contained"
            sx={{ background: "#4CAF50" }}
            onClick={exportExcel}
          >
            Export Excel
          </Button>
        </Stack>
      </Paper>

      {/* Summary Boxes */}
      {report && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Returned Orders
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {report.totalOrders}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Refunded Amount
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                Rs. {report.totalRefundAmount}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Restocked Items
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {report.totalRestockedItems}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Refund Amount (Rs)</TableCell>
                <TableCell>Restocked</TableCell>
                <TableCell>Restocked At</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : !report || report.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                report.items.map((o: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell>{o.orderId}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>Rs {o.refundAmount}</TableCell>
                    <TableCell>{o.restocked ? "Yes" : "No"}</TableCell>
                    <TableCell>{o.restockedAt || "-"}</TableCell>
                    <TableCell>{o.createdAt}</TableCell>
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

export default RefundsReturnsReport;

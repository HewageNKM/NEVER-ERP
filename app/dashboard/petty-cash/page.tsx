"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Pagination,
  Grid,
  TextField,
  MenuItem,
  Breadcrumbs,
  CircularProgress,
} from "@mui/material";
import { IconEye, IconPlus, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PettyCash } from "@/model/PettyCash";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { getToken } from "@/firebase/firebaseClient";
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";

export default function PettyCashList() {
  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters state (Inputs)
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
  });

  // Applied Filters state (Used for fetching)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
  });

  const router = useRouter();
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchPettyCash();
  }, [page, currentUser, appliedFilters]);

  const fetchPettyCash = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      let url = `/api/v2/petty-cash?page=${page}&size=10`;

      if (appliedFilters.search)
        url += `&search=${encodeURIComponent(appliedFilters.search)}`;
      if (appliedFilters.status !== "ALL")
        url += `&status=${appliedFilters.status}`;
      if (appliedFilters.type !== "ALL") url += `&type=${appliedFilters.type}`;
      if (appliedFilters.category !== "ALL")
        url += `&category=${encodeURIComponent(appliedFilters.category)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setPettyCashList(data.data);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error("Failed to fetch petty cash list", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleClear = () => {
    const defaults = {
      search: "",
      status: "ALL",
      type: "ALL",
      category: "ALL",
    };
    setFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await fetch(`/api/v2/petty-cash/${id}`, { method: "DELETE" });
        fetchPettyCash();
      } catch (error) {
        console.error("Failed to delete entry", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* Breadcrumb + Header */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Typography color="text.primary">
          <Link href="/dashboard">Dashboard</Link>
        </Typography>
        <Typography color="text.primary">Petty Cash</Typography>
      </Breadcrumbs>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h3">Petty Cash</Typography>

        <Button
          component={Link}
          href="/dashboard/petty-cash/create"
          variant="contained"
          color="primary"
          startIcon={<IconPlus />}
        >
          Create New
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search by Note"
                size="small"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                size="small"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label="Type"
                size="small"
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="income">Income</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                size="small"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFilter}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : pettyCashList?.length > 0 ? (
                  pettyCashList.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.amount}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.note}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={getStatusColor(entry.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(entry.createdAt as string).toLocaleString()}
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          component={Link}
                          href={`/dashboard/petty-cash/${entry.id}`}
                          color="primary"
                        >
                          <IconEye size={20} />
                        </IconButton>

                        <IconButton
                          disabled={entry.status === "APPROVED"}
                          color="error"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <IconTrash size={20} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2} display="flex" justifyContent="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

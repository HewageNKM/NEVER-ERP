/** @jsxImportSource @emotion/react */
"use client";

import React, { useEffect, useState } from "react";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import axios from "axios";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { Size } from "@/model/Size";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const actionsBar = css`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const filtersRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const StyledTable = styled(Table)`
  border: 1px solid #eee;
  border-radius: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #777;
  padding: 2rem;
`;

const SizePage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const { showNotification } = useSnackbar();
  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [form, setForm] = useState({
    name: "",
    status: true,
  });

  // Fetch Sizes
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const token = await getToken();
      const { data } = await axios({
        method: "GET",
        url: "/api/v1/master/sizes",
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSizes(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch sizes", e);
      showNotification("Failed to fetch sizes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchSizes();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      setForm({ name: size.name, status: size.status });
    } else {
      setEditingSize(null);
      setForm({ name: "", status: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();

      if (editingSize) {
        await axios({
          method: "PUT",
          url: `/api/v1/master/sizes/${editingSize.id}`,
          data: form,
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios({
          method: "POST",
          url: "/api/v1/master/sizes",
          data: form,
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchSizes();
      setOpen(false);
    } catch (e) {
      console.error("Failed to save size", e);
      showNotification("Failed to save size", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "Delete Size",
      message: "Are you sure you want to delete this size?",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios({
            method: "DELETE",
            url: `/api/v1/master/sizes/${id}`,
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchSizes();
        } catch (e) {
          console.error("Failed to delete size", e);
          showNotification("Failed to delete size", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <PageContainer title="Sizes" description="Size Management">
      <DashboardCard title="Manage Sizes">
        {/* Filters */}
        <Box css={actionsBar}>
          <Box css={filtersRow}>
            <TextField
              size="small"
              placeholder="Search sizes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search />,
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "all" | "active" | "inactive")
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchSizes();
              }}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Search />
                )
              }
            >
              {loading ? "Filtering..." : "Apply Filters"}
            </Button>
            <Button
              variant="text"
              color="secondary"
              startIcon={<Delete />}
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchSizes();
              }}
            >
              Clear
            </Button>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Size
          </Button>
        </Box>

        {/* Table */}
        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : sizes.length === 0 ? (
          <EmptyState>No sizes found.</EmptyState>
        ) : (
          <>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell>{size.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={size.status ? "Active" : "Inactive"}
                        color={size.status ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenDialog(size)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(size.id!)}
                        color="error"
                        disabled={deletingId === size.id}
                      >
                        {deletingId === size.id ? (
                          <CircularProgress size={20} color="error" />
                        ) : (
                          <Delete />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>

            {/* Pagination */}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.size)}
                page={pagination.page}
                onChange={(_, value) =>
                  setPagination((prev) => ({ ...prev, page: value }))
                }
                color="primary"
              />
            </Box>
          </>
        )}

        {/* Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>{editingSize ? "Edit Size" : "Add Size"}</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              fullWidth
              label="Size Name"
              disabled={saving}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Box
              mt={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography>Status</Typography>
              <Switch
                disabled={saving}
                checked={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardCard>
    </PageContainer>
  );
};

export default SizePage;

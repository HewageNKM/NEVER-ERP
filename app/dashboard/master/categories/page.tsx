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
  InputAdornment,
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
import { Add, Edit, Search, Delete } from "@mui/icons-material";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Category } from "@/model/Category";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// Emotion styles
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

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
  });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: true });
  const { showConfirmation } = useConfirmationDialog();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await axios({
        method: "GET",
        url: "/api/v1/master/categories",
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchCategories();
  }, [pagination.page, pagination.size, currentUser]);

  // Open Add/Edit Dialog
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setForm({
        name: category.name,
        description: category.description || "",
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setForm({ name: "", description: "", status: true });
    }
    setOpen(true);
  };

  // Save (Add/Edit)
  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();

      if (editingCategory) {
        await axios.put(
          `/api/v1/master/categories/${editingCategory.id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("/api/v1/master/categories", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchCategories();
      setOpen(false);
    } catch (e) {
      console.error("Failed to save category", e);
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete
  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "Delete Category",
      message: "Are you sure you want to delete this category?",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios.delete(`/api/v1/master/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchCategories();
        } catch (e) {
          console.error("Failed to delete category", e);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <PageContainer title="Categories" description="Category Management">
      <DashboardCard title="Manage Categories">
        {/* Filters & Actions */}
        <Box css={actionsBar}>
          <Box css={filtersRow}>
            <TextField
              size="small"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
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

            {/* ✅ Apply Filters */}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchCategories();
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

            {/* ✅ Clear Filters */}
            <Button
              variant="text"
              color="secondary"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchCategories();
              }}
              disabled={loading}
              startIcon={<Delete />}
            >
              Clear
            </Button>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Category"
            )}
          </Button>
        </Box>

        {/* Table */}
        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <EmptyState>No categories found.</EmptyState>
        ) : (
          <>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.description}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={cat.status ? "Active" : "Inactive"}
                          color={cat.status ? "success" : "error"}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(cat)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                      >
                        {deletingId === cat.id ? (
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

        {/* Add/Edit Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              fullWidth
              disabled={saving}
              label="Category Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              disabled={saving}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <Box display="flex" alignItems="center" mt={2}>
              <Switch
                disabled={saving}
                checked={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
                color="success"
              />
              <Typography sx={{ ml: 1 }}>
                {form.status ? "Active" : "Inactive"}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {editingCategory ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardCard>
    </PageContainer>
  );
};

export default CategoryPage;

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
  Avatar,
} from "@mui/material";
import { Add, Edit, Search, Delete, Upload } from "@mui/icons-material";
import axios from "axios";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Brand } from "@/model/Brand";
import { useSnackbar } from "@/contexts/SnackBarContext";
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

const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const { showNotification } = useSnackbar();
  const { showConfirmation } = useConfirmationDialog();

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
    logoFile: null as File | null,
    logoUrl: "",
  });

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const { data } = await axios.get("/api/v1/master/brands", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setBrands(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch brands", e);
      showNotification("Failed to fetch brands", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchBrands();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({
        name: brand.name,
        description: brand.description || "",
        status: brand.status,
        logxoFile: null,
        logoUrl: brand.logoUrl || "",
      });
    } else {
      setEditingBrand(null);
      setForm({
        name: "",
        description: "",
        status: true,
        logoFile: null,
        logoUrl: "",
      });
    }
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, logoFile: file }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();

      if (form.logoFile) {
        if (form.logoFile.size > 1024 * 1024) {
          showNotification("Logo file size must be less than ", "error");
          return;
        }
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("status", String(form.status));
      if (form.logoFile) formData.append("logo", form.logoFile);

      if (editingBrand) {
        await axios.put(`/api/v1/master/brands/${editingBrand.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/v1/master/brands", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchBrands();
      setOpen(false);
    } catch (e) {
      console.error("Failed to save brand", e);
      showNotification("Failed to save brand", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "Delete Brand",
      message: "Are you sure you want to delete this brand?",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          const token = await getToken();
          await axios.delete(`/api/v1/master/brands/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchBrands();
        } catch (e) {
          console.error("Failed to delete brand", e);
          showNotification("Failed to delete brand", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <PageContainer title="Brands" description="Brand Management">
      <DashboardCard title="Manage Brands">
        {/* Filters */}
        <Box css={actionsBar}>
          <Box css={filtersRow}>
            <TextField
              size="small"
              placeholder="Search brands..."
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

            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchBrands();
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
                fetchBrands();
              }}
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
              "Add Brand"
            )}
          </Button>
        </Box>

        {/* Table */}
        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : brands.length === 0 ? (
          <EmptyState>No brands found.</EmptyState>
        ) : (
          <>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TableCell>Logo</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      {brand.logoUrl ? (
                        <Avatar src={brand.logoUrl} alt={brand.name} />
                      ) : (
                        <Avatar>{brand.name.charAt(0)}</Avatar>
                      )}
                    </TableCell>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>{brand.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={brand.status ? "Active" : "Inactive"}
                        color={brand.status ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(brand)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(brand.id)}
                        disabled={deletingId === brand.id}
                      >
                        {deletingId === brand.id ? (
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
          <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              fullWidth
              label="Brand Name"
              disabled={saving}
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

            <Box
              mt={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle2">Active Status</Typography>
              <Switch
                checked={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
                color="primary"
                disabled={saving}
              />
            </Box>

            <Box mt={2}>
              <Button
                component="label"
                startIcon={<Upload />}
                variant="outlined"
                disabled={saving}
              >
                Upload Logo
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  multiple={false}
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {form.logoUrl && (
                <Avatar
                  src={form.logoUrl}
                  alt="logo"
                  sx={{ ml: 2, display: "inline-flex" }}
                />
              )}

              {form.logoFile && (
                <Typography variant="body2" sx={{ ml: 1, display: "inline" }}>
                  {form.logoFile.name}
                </Typography>
              )}
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

export default BrandPage;

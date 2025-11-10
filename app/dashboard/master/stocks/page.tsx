"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Pagination,
} from "@mui/material";
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient"; // Adjust path
import { useAppSelector } from "@/lib/hooks"; // Adjust path
import axios from "axios";
import { useSnackbar } from "@/contexts/SnackBarContext"; // Adjust path
import { Stock } from "@/model/Stock";
import StockListTable from "./components/StockListTable";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import StockFormModal from "./components/StockForm";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- MAIN PAGE COMPONENT ---
const StockPage: React.FC = () => {
  const [locations, setLocations] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );
  const { showNotification } = useSnackbar();
  const { showConfirmation } = useConfirmationDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Stock | null>(null);

  // --- Data Fetching ---
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params: any = { page: pagination.page, size: pagination.size };
      if (search) params.search = search;
      if (status !== "all") params.status = status === "active"; // Convert to boolean for API

      // **ASSUMED API ENDPOINT**
      const response = await axios.get("/api/v2/master/stocks", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      setLocations(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e) {
      console.error("Failed to fetch stock locations", e);
      showNotification("Failed to fetch stock locations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchLocations();
    }
  }, [pagination.page, currentUser, authLoading]); // Fetch on page change or auth load

  // --- Handlers ---
  const handleFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset page on filter
    fetchLocations();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    // We need fetchLocations to be called after state updates,
    // so we call it in a useEffect or directly after resetting state
    // For simplicity, let's call it directly (though useEffect might be cleaner)
    fetchLocations(); // Re-fetch with cleared filters
  };

  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (location: Stock) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  const handleSaveLocation = async (
    locationData: Omit<Stock, "id" | "createdAt" | "updatedAt">
  ) => {
    const isEditing = !!editingLocation;
    // **ASSUMED API ENDPOINTS**
    const url = isEditing
      ? `/api/v2/master/stocks/${editingLocation!.id}`
      : "/api/v2/master/stocks";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = await getToken();
      await axios({
        method: method,
        url: url,
        data: locationData,
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification(
        `Location ${isEditing ? "updated" : "added"} successfully!`,
        "success"
      );
      handleCloseModal();
      fetchLocations(); // Refetch data
    } catch (error: any) {
      console.error("Error saving location:", error);
      const message =
        error.response?.data?.message || "Failed to save location";
      showNotification(message, "error");
      // Keep modal open on error?
    }
  };

  const handleDeleteLocation = async (id: string) => {
    showConfirmation({
      title: "Delete Location",
      message: "Are you sure you want to delete this location?",
      onSuccess: async () => {
        try {
          const token = await getToken();
          // **ASSUMED API ENDPOINT**
          await axios.delete(`/api/v2/master/stocks/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Location deleted successfully!", "success");
          fetchLocations(); // Refetch data
        } catch (error: any) {
          console.error("Error deleting location:", error);
          const message =
            error.response?.data?.message || "Failed to delete location";
          showNotification(message, "error");
        }
      },
    });
  };

  return (
    <PageContainer
      title="Stock Locations"
      description="Manage Warehouses and Stores"
    >
      <DashboardCard
        title="Manage Stock Locations"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus />}
            onClick={handleOpenCreateModal}
          >
            Add Location
          </Button>
        }
      >
        {/* --- FILTER BAR --- */}
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
          <TextField
            size="small"
            name="search"
            label="Search Name/Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={16} /> : <IconSearch />
            }
            onClick={handleFilter}
            disabled={loading}
          >
            {loading ? "Filtering..." : "Filter"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<IconX />}
            onClick={handleClearFilters}
            disabled={loading}
          >
            Clear
          </Button>
        </Box>

        {/* --- TABLE & PAGINATION --- */}
        <StockListTable
          locations={locations}
          loading={loading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteLocation}
        />
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(pagination.total / pagination.size)}
            page={pagination.page}
            onChange={(_, value) =>
              setPagination((prev) => ({ ...prev, page: value }))
            }
            color="primary"
            disabled={loading}
          />
        </Box>
      </DashboardCard>

      {/* --- MODAL --- */}
      <StockFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLocation}
        location={editingLocation}
      />
    </PageContainer>
  );
};

export default StockPage;

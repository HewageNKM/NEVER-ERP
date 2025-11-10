"use client";
import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
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
import { Product } from "@/model/Product";
import ProductListTable from "./components/ProductListTable";
import ProductFormModal from "./components/ProductFormModal";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { useSnackbar } from "@/contexts/SnackBarContext"; // Import snackbar
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

export interface DropdownOption {
  id: string;
  label: string;
}

const initialFilterState = {
  search: "",
  brand: "all",
  category: "all",
  status: "all",
  listing: "all",
};

// --- MAIN PAGE COMPONENT ---
const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );
  const { showNotification } = useSnackbar(); // Get snackbar function

  // Maps for faster lookups in the table
  const [brandMap, setBrandMap] = useState(new Map<string, string>());
  const [categoryMap, setCategoryMap] = useState(new Map<string, string>());
  const { showConfirmation } = useConfirmationDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- State for Filters and Pagination ---
  const [loading, setLoading] = useState(false); // For table fetching
  const [isSaving, setIsSaving] = useState(false); // For modal saving
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    brand: "all",
    category: "all",
    status: "all",
    listing: "all",
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchProducts(); // Initial fetch
      fetchDropdown("/api/v2/master/brands/dropdown", setBrands, setBrandMap);
      fetchDropdown(
        "/api/v2/master/categories/dropdown",
        setCategories,
        setCategoryMap
      );
      fetchDropdown("/api/v2/master/sizes/dropdown", setSizes);
    }
  }, [currentUser, authLoading]); // Only run on auth change

  // Re-fetch when page changes
  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
  }, [pagination.page, currentUser]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Build params object from state
      const params: any = {
        page: pagination.page,
        size: pagination.size,
      };
      if (filters.search) params.search = filters.search;
      if (filters.brand !== "all") params.brand = filters.brand;
      if (filters.category !== "all") params.category = filters.category;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.listing !== "all") params.listing = filters.listing;

      const response = await axios.get("/api/v2/master/products", {
        headers: { Authorization: `Bearer ${token}` },
        params: params, // Pass filters as URL params
      });

      setProducts(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch products", e);
      showNotification(
        e.response?.data?.message || "Failed to fetch products",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. ADD THE CLEAR FILTER HANDLER
  const handleClearFilters = () => {
    // Check if filters are already clear to avoid unnecessary re-fetch
    if (JSON.stringify(filters) === JSON.stringify(initialFilterState)) {
      return;
    }
    setFilters(initialFilterState);
    setPagination((prev) => ({ ...prev, page: 1 }));
    // We call fetchProducts() here to match your existing pattern in handleFilter
    // This will trigger a re-fetch.
    fetchProducts();
  };

  // Handle filter button click
  const handleFilter = () => {
    // Reset to page 1 when filtering
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  // Handle filter input changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name!]: value as string,
    }));
  };

  const fetchDropdown = async (
    url: string,
    setData: (data: DropdownOption[]) => void,
    setMap?: (map: Map<string, string>) => void
  ) => {
    try {
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const options = response.data || [];
      setData(options);
      if (setMap) {
        setMap(
          new Map(
            options.map((item: DropdownOption) => [item.label, item.label])
          )
        );
      }
    } catch (e) {
      console.error("Failed to fetch dropdown data", e);
    }
  };

  // --- CRUD Handlers ---
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (productData: Product, file: File | null) => {
    setIsSaving(true); // --- Start saving loader ---
    const isEditing = !!productData.productId;
    const url = isEditing
      ? `/api/v2/master/products/${productData.productId}`
      : "/api/v2/master/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = await getToken();
      const formData = new FormData();

      if (file) {
        formData.append("thumbnail", file);
      } else if (isEditing && productData.thumbnail) {
        formData.append("thumbnail", JSON.stringify(productData.thumbnail));
      }

      for (const [key, value] of Object.entries(productData)) {
        if (key === "thumbnail") continue;
        if (key === "variants" || key === "tags") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to save product");
      }

      // --- Show success notification ---
      showNotification(
        isEditing
          ? "Product updated successfully"
          : "Product added successfully",
        "success"
      );
      handleCloseModal();
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      // --- Show error notification ---
      showNotification(
        error.message || "An error occurred while saving",
        "error"
      );
    } finally {
      setIsSaving(false); // --- Stop saving loader ---
    }
  };

  const handleDeleteProduct = async (itemId: string) => {
    showConfirmation({
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      onSuccess: async () => {
        setLoading(true); // Use main table loader for delete
        try {
          const token = await getToken();
          const response = await axios.delete(
            `/api/v2/master/products/${itemId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.status !== 200)
            throw new Error("Failed to delete product");

          // --- Show success notification ---
          showNotification("Product deleted successfully", "success");
          fetchProducts(); // Refetch products
        } catch (error: any) {
          console.error("Error deleting product:", error);
          // --- Show error notification ---
          showNotification(
            error.message || "An error occurred while deleting",
            "error"
          );
        } finally {
          setLoading(false); // Stop table loader
        }
      },
    });
  };

  return (
    <PageContainer title="Products" description="Products Management">
      <DashboardCard
        title="Products Management"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus />}
            onClick={handleOpenCreateModal}
          >
            Add New Product
          </Button>
        }
      >
        {/* --- FILTER BAR --- */}
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
          {/* ... (filter fields are unchanged) ... */}
          <TextField
            size="small"
            name="search"
            label="Search..."
            value={filters.search}
            onChange={handleFilterChange}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={filters.category}
              label="Category"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.label}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Brand</InputLabel>
            <Select
              name="brand"
              value={filters.brand}
              label="Brand"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Brands</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.label}>
                  {brand.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Listing</InputLabel>
            <Select
              name="listing"
              value={filters.listing}
              label="Listing"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Listing</MenuItem>
              <MenuItem value="true">Listed</MenuItem>
              <MenuItem value="false">Unlisted</MenuItem>
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
        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <ProductListTable
              products={products}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProduct}
              brandMap={brandMap}
              categoryMap={categoryMap}
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
          </>
        )}
      </DashboardCard>

      {/* --- Pass saving state to modal --- */}
      <ProductFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
        brands={brands}
        categories={categories}
        sizes={sizes}
        saving={isSaving}
      />
    </PageContainer>
  );
};

export default ProductPage;

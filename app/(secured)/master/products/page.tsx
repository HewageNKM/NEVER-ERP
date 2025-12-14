"use client";
import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard"; // Try to use this as a container, or replace if needed
import {
  IconPlus,
  IconSearch,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader,
} from "@tabler/icons-react";
import { Product } from "@/model/Product";
import ProductListTable from "./components/ProductListTable";
import ProductFormModal from "./components/ProductFormModal";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { showNotification } from "@/utils/toast";
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
  

  // Maps for faster lookups in the table
  const [brandMap, setBrandMap] = useState(new Map<string, string>());
  const [categoryMap, setCategoryMap] = useState(new Map<string, string>());
  const { showConfirmation } = useConfirmationDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- State for Filters and Pagination ---
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      fetchProducts();
      fetchDropdown("/api/v2/master/brands/dropdown", setBrands, setBrandMap);
      fetchDropdown(
        "/api/v2/master/categories/dropdown",
        setCategories,
        setCategoryMap
      );
      fetchDropdown("/api/v2/master/sizes/dropdown", setSizes);
    }
  }, [currentUser, authLoading]);

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
        params: params,
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

  const handleClearFilters = () => {
    if (JSON.stringify(filters) === JSON.stringify(initialFilterState)) {
      return;
    }
    setFilters(initialFilterState);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value as string,
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
    setIsSaving(true);
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
      showNotification(
        error.message || "An error occurred while saving",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (itemId: string) => {
    showConfirmation({
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      onSuccess: async () => {
        setLoading(true);
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

          showNotification("Product deleted successfully", "success");
          fetchProducts();
        } catch (error: any) {
          console.error("Error deleting product:", error);
          showNotification(
            error.message || "An error occurred while deleting",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <PageContainer title="Products" description="Products Management">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Products Management
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm"
          >
            <IconPlus size={18} className="mr-2" />
            Add New Product
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          {/* --- FILTER BAR --- */}
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="w-full md:w-auto flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Search
              </label>
              <input
                type="text"
                name="search"
                placeholder="Search..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              />
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Brand
              </label>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.label}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[120px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[120px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Listing
              </label>
              <select
                name="listing"
                value={filters.listing}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Listing</option>
                <option value="true">Listed</option>
                <option value="false">Unlisted</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <>
                    <IconSearch size={16} className="mr-2" />
                    Filter
                  </>
                )}
              </button>
              <button
                onClick={handleClearFilters}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <IconX size={16} className="mr-2" />
                Clear
              </button>
            </div>
          </div>

          {/* --- TABLE & PAGINATION --- */}
          {loading ? (
            <div className="text-center py-12">
              <IconLoader
                className="animate-spin mx-auto text-gray-400"
                size={32}
              />
              <p className="mt-2 text-gray-500 text-sm font-bold uppercase">
                Loading Products...
              </p>
            </div>
          ) : (
            <>
              <ProductListTable
                products={products}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteProduct}
                brandMap={brandMap}
                categoryMap={categoryMap}
              />
              <div className="flex justify-center mt-6">
                {/* Simple Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 px-4">
                    Page {pagination.page} of{" "}
                    {Math.ceil(pagination.total / pagination.size) || 1}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(
                          Math.ceil(pagination.total / pagination.size),
                          prev.page + 1
                        ),
                      }))
                    }
                    disabled={
                      pagination.page >=
                      Math.ceil(pagination.total / pagination.size)
                    }
                    className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

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
      </div>
    </PageContainer>
  );
};

export default ProductPage;

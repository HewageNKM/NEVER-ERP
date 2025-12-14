"use client";
import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader,
  IconFilter,
  IconPackage,
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

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm",
  iconBtn:
    "w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
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
    // Quick re-fetch workaround without useEffect dependency on filters
    setTimeout(fetchProducts, 0);
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
        isEditing ? "PRODUCT UPDATED" : "PRODUCT CREATED",
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
      title: "DELETE PRODUCT?",
      message: "This action cannot be undone. Confirm deletion?",
      variant: "danger",
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

          showNotification("PRODUCT DELETED", "success");
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
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconPackage size={14} /> Catalog Management
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Products
            </h2>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <IconPlus size={18} className="mr-2" />
            New Product
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className={styles.label}>Search</label>
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="search"
                  placeholder="SEARCH PRODUCTS..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={styles.label}>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="all">ALL CATEGORIES</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={styles.label}>Brand</label>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="all">ALL BRANDS</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.label}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={styles.label}>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="all">ALL STATUS</option>
                <option value="true">ACTIVE</option>
                <option value="false">INACTIVE</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading}
                className={`${styles.primaryBtn} w-full`}
              >
                {loading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <IconFilter size={16} />
                )}
              </button>
              <button
                onClick={handleClearFilters}
                disabled={loading}
                className={`${styles.secondaryBtn} w-full`}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <IconLoader className="animate-spin text-black mb-3" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Loading Data
              </p>
            </div>
          ) : (
            <ProductListTable
              products={products}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProduct}
              brandMap={brandMap}
              categoryMap={categoryMap}
            />
          )}
        </div>

        {/* --- PAGINATION --- */}
        {!loading && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className={styles.iconBtn}
              >
                <IconChevronLeft size={18} />
              </button>

              <span className="text-xs font-black text-black px-4 uppercase tracking-widest">
                Page {pagination.page}{" "}
                <span className="text-gray-400">
                  / {Math.ceil(pagination.total / pagination.size) || 1}
                </span>
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
                className={styles.iconBtn}
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* --- MODAL --- */}
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

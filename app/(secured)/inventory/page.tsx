"use client";

import React, { useState, useEffect } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconLoader,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { DropdownOption } from "../master/products/page";
import { InventoryItem } from "@/model/InventoryItem";
import InventoryListTable from "./components/InventoryListTable";
import InventoryFormModal from "./components/InventoryFormModal";
import { showNotification } from "@/utils/toast";

interface StockLocationOption extends DropdownOption {}

const initialFilterState = {
  productId: null as string | null,
  variantId: "all",
  size: "all",
  stockId: "all",
};

const InventoryPage = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [variants, setVariants] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationOption[]>(
    []
  );
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const [filters, setFilters] = useState(initialFilterState);

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchInventory(); // Initial fetch
      fetchDropdown("/api/v2/master/products/dropdown", setProducts);
      fetchDropdown("/api/v2/master/sizes/dropdown", setSizes);
      fetchDropdown("/api/v2/master/stocks/dropdown", setStockLocations);
    }
  }, [currentUser]);

  // Re-fetch when page or filters change (filters are now handled by buttons)
  useEffect(() => {
    if (currentUser) {
      fetchInventory();
    }
  }, [pagination.page]);

  const fetchInventory = async (isClearing: boolean = false) => {
    setLoading(true);
    const activeFilters = isClearing ? initialFilterState : filters;

    try {
      const token = await getToken();
      const params: any = {
        page: isClearing ? 1 : pagination.page,
        size: pagination.size,
      };

      if (activeFilters.productId) params.productId = activeFilters.productId;
      if (activeFilters.variantId !== "all")
        params.variantId = activeFilters.variantId;
      if (activeFilters.size !== "all") params.variantSize = activeFilters.size;
      if (activeFilters.stockId !== "all")
        params.stockId = activeFilters.stockId;

      const response = await axios.get("/api/v2/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      setInventoryItems(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
        page: isClearing ? 1 : prev.page,
      }));
    } catch (e: any) {
      console.error("Failed to fetch inventory", e);
      showNotification("Failed to fetch inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async (url: string, setData: (data: any[]) => void) => {
    try {
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || []);
    } catch (e) {
      console.error(`Failed to fetch dropdown data from ${url}`, e);
    }
  };

  const fetchVariantsDropdown = async (productId: string) => {
    setVariantLoading(true);
    setVariants([]);
    try {
      const url = `/api/v2/master/products/${productId}/variants/dropdown`;
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVariants(response.data || []);
    } catch (e) {
      console.error(`Failed to fetch variants for product ${productId}`, e);
    } finally {
      setVariantLoading(false);
    }
  };

  // --- Handlers ---
  const handleFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInventory();
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
    setVariants([]);
    if (pagination.page === 1) {
      fetchInventory(true);
    } else {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handleFilterChange = (
    name: string,
    value: string | DropdownOption | null
  ) => {
    // For standard selects, value is string.
    // For manual handling (like wrapping Autocomplete logic if we built one), it might be option.
    // Here we are using standard selects, so value is string ID.
    if (name === "productId") {
      const newProductId = value as string; // Standard select returns string value
      setFilters((prev) => ({
        ...prev,
        productId: newProductId || null,
        variantId: "all",
      }));

      if (newProductId) {
        fetchVariantsDropdown(newProductId);
      } else {
        setVariants([]);
      }
    } else {
      setFilters((prev) => ({
        ...prev,
        [name!]: value as string,
      }));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveStock = async (itemData: InventoryItem) => {
    const { productId, variantId, size, stockId, quantity } = itemData;
    const payload = { productId, variantId, size, stockId, quantity };

    const isEditing = !!editingItem;
    const url = isEditing
      ? `/api/v2/inventory/${editingItem!.id}`
      : "/api/v2/inventory";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = await getToken();
      await axios({
        method: method,
        url: url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      fetchInventory();
      showNotification("Stock item saved successfully", "success");
    } catch (error) {
      console.error("Error saving stock item:", error);
      showNotification("Error saving stock item", "error");
    }
  };

  return (
    <PageContainer title="Stocks" description="Stock Management">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Stock Management
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm"
          >
            <IconPlus size={18} className="mr-2" />
            Add Stock Entry
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          {/* --- FILTER BAR --- */}
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="w-full md:w-auto flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Product
              </label>
              <select
                value={filters.productId || ""}
                onChange={(e) =>
                  handleFilterChange("productId", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Variant
                </label>
                {variantLoading && (
                  <IconLoader
                    size={12}
                    className="animate-spin text-gray-500"
                  />
                )}
              </div>
              <select
                value={filters.variantId}
                onChange={(e) =>
                  handleFilterChange("variantId", e.target.value)
                }
                disabled={!filters.productId || variantLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50"
              >
                <option value="all">All Variants</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[120px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Size
              </label>
              <select
                value={filters.size}
                onChange={(e) => handleFilterChange("size", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Sizes</option>
                {sizes.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Stock Location
              </label>
              <select
                value={filters.stockId}
                onChange={(e) => handleFilterChange("stockId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              >
                <option value="all">All Locations</option>
                {stockLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading || variantLoading}
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
                disabled={loading || variantLoading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <IconX size={16} className="mr-2" />
                Clear
              </button>
            </div>
          </div>

          <InventoryListTable
            items={inventoryItems}
            loading={loading}
            onEdit={handleOpenEditModal}
            products={products}
            sizes={sizes}
            stockLocations={stockLocations}
          />

          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1 || loading}
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
                    Math.ceil(pagination.total / pagination.size) || loading
                }
                className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <InventoryFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStock}
        item={editingItem}
        products={products}
        sizes={sizes}
        stockLocations={stockLocations}
      />
    </PageContainer>
  );
};

export default InventoryPage;

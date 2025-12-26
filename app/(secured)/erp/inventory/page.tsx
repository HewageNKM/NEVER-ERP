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
  IconStack2,
  IconBoxSeam,
  IconFilter,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { DropdownOption } from "../master/products/page";
import { InventoryItem } from "@/model/InventoryItem";
import InventoryListTable from "./components/InventoryListTable";
import InventoryFormModal from "./components/InventoryFormModal";
import BulkInventoryFormModal from "./components/BulkInventoryFormModal";
import { showNotification } from "@/utils/toast";

interface StockLocationOption extends DropdownOption {}

const initialFilterState = {
  productId: null as string | null,
  variantId: "all",
  size: "all",
  stockId: "all",
};

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm",
  iconBtn:
    "w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
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

  // Re-fetch when page or filters change
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
    if (name === "productId") {
      const newProductId = value as string;
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
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconBoxSeam size={14} /> Inventory Control
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Stock Management
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center justify-center px-6 py-4 bg-white border-2 border-black text-black text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <IconStack2 size={18} className="mr-2" />
              Bulk Add
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <IconPlus size={18} className="mr-2" />
              New Entry
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Product Filter */}
            <div className="md:col-span-3">
              <label className={styles.label}>Product</label>
              <select
                value={filters.productId || ""}
                onChange={(e) =>
                  handleFilterChange("productId", e.target.value)
                }
                className={styles.select}
              >
                <option value="">ALL PRODUCTS</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Filter */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                  Variant
                </label>
                {variantLoading && (
                  <IconLoader size={12} className="animate-spin text-black" />
                )}
              </div>
              <select
                value={filters.variantId}
                onChange={(e) =>
                  handleFilterChange("variantId", e.target.value)
                }
                disabled={!filters.productId || variantLoading}
                className={styles.select}
              >
                <option value="all">ALL VARIANTS</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="md:col-span-2">
              <label className={styles.label}>Size</label>
              <select
                value={filters.size}
                onChange={(e) => handleFilterChange("size", e.target.value)}
                className={styles.select}
              >
                <option value="all">ALL SIZES</option>
                {sizes.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="md:col-span-2">
              <label className={styles.label}>Location</label>
              <select
                value={filters.stockId}
                onChange={(e) => handleFilterChange("stockId", e.target.value)}
                className={styles.select}
              >
                <option value="all">ALL LOCATIONS</option>
                {stockLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleFilter}
                disabled={loading || variantLoading}
                className={`${styles.primaryBtn} w-full`}
              >
                {loading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <IconSearch size={16} />
                )}
              </button>
              <button
                onClick={handleClearFilters}
                disabled={loading || variantLoading}
                className={`${styles.secondaryBtn} w-full`}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="w-full">
          <InventoryListTable
            items={inventoryItems}
            loading={loading}
            onEdit={handleOpenEditModal}
            products={products}
            sizes={sizes}
            stockLocations={stockLocations}
          />

          {/* Pagination */}
          {!loading && inventoryItems.length > 0 && (
            <div className="flex justify-center mt-8">
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

                <div className="px-6 font-black text-sm tracking-widest uppercase">
                  PAGE {pagination.page}{" "}
                  <span className="text-gray-400">/</span>{" "}
                  {Math.ceil(pagination.total / pagination.size) || 1}
                </div>

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

      <BulkInventoryFormModal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={fetchInventory}
        products={products}
        stockLocations={stockLocations}
      />
    </PageContainer>
  );
};

export default InventoryPage;

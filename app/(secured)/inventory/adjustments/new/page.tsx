"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconAdjustments,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Product {
  id: string;
  label: string;
}

interface Stock {
  id: string;
  label: string;
}

interface AdjustmentItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

const TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: "add", label: "Stock Addition" },
  { value: "remove", label: "Stock Removal" },
  { value: "damage", label: "Damaged Goods" },
  { value: "return", label: "Customer Return" },
  { value: "transfer", label: "Stock Transfer" },
];

const NewAdjustmentPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [type, setType] = useState<AdjustmentType>("add");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<AdjustmentItem[]>([]);

  // Item form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [stockId, setStockId] = useState("");
  const [destinationStockId, setDestinationStockId] = useState("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      const [productsRes, stocksRes] = await Promise.all([
        axios.get<Product[]>("/api/v2/master/products/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Stock[]>("/api/v2/master/stocks/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProducts(productsRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const handleAddItem = () => {
    if (!selectedProduct || !size || quantity <= 0 || !stockId) {
      showNotification("Please fill all item fields", "warning");
      return;
    }

    if (type === "transfer" && !destinationStockId) {
      showNotification(
        "Please select destination stock for transfer",
        "warning"
      );
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    const stock = stocks.find((s) => s.id === stockId);
    const destStock = stocks.find((s) => s.id === destinationStockId);

    if (!product || !stock) return;

    const newItem: AdjustmentItem = {
      productId: product.id,
      productName: product.label,
      size,
      quantity,
      stockId: stock.id,
      stockName: stock.label,
      ...(type === "transfer" && destStock
        ? {
            destinationStockId: destStock.id,
            destinationStockName: destStock.label,
          }
        : {}),
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSize("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      showNotification("Please enter a reason", "warning");
      return;
    }
    if (items.length === 0) {
      showNotification("Please add at least one item", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();

      await axios.post(
        "/api/v2/inventory/adjustments",
        { type, reason, notes, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification("Adjustment created and inventory updated", "success");
      router.push("/inventory/adjustments");
    } catch (error) {
      console.error(error);
      showNotification("Failed to create adjustment", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="New Adjustment">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New Adjustment">
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg md:text-2xl font-bold uppercase tracking-tight text-gray-900">
              New Adjustment
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Adjust stock levels
            </p>
          </div>
        </div>

        {/* Type & Reason */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Adjustment Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AdjustmentType)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Reason *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Physical count correction"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional additional notes"
              className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Add Item - Mobile Stacked, Desktop Grid */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-900">
              Add Items
            </h3>
          </div>
          <div className="p-4 md:p-6 space-y-3 md:space-y-0 md:grid md:grid-cols-6 md:gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 md:hidden">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 md:contents">
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Size
                </label>
                <input
                  type="text"
                  placeholder="Size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Qty
                </label>
                <input
                  type="number"
                  placeholder="Qty"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 md:hidden">
                Stock Location
              </label>
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Select Stock</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {type === "transfer" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Destination
                </label>
                <select
                  value={destinationStockId}
                  onChange={(e) => setDestinationStockId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
                >
                  <option value="">To Stock</option>
                  {stocks
                    .filter((s) => s.id !== stockId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className={type === "transfer" ? "md:col-span-6" : ""}>
              <button
                onClick={handleAddItem}
                className="w-full px-4 py-2.5 bg-black text-white text-xs font-bold uppercase hover:bg-gray-900 flex items-center justify-center gap-2"
              >
                <IconPlus size={14} />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Items - Card on Mobile, Table on Desktop */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">Size</th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Qty
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Stock
                    </th>
                    {type === "transfer" && (
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Destination
                      </th>
                    )}
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4">{item.size}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {type === "add" || type === "return" ? "+" : "-"}
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4">{item.stockName}</td>
                      {type === "transfer" && (
                        <td className="px-6 py-4">
                          {item.destinationStockName}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-600 hover:bg-red-50"
                        >
                          <IconTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex justify-between items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.size} • {item.stockName}
                      {type === "transfer" && ` → ${item.destinationStockName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm ${
                        type === "add" || type === "return"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {type === "add" || type === "return" ? "+" : "-"}
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto px-6 md:px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <IconLoader2 size={14} className="animate-spin" />
            ) : (
              <IconAdjustments size={14} />
            )}
            Create Adjustment
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default NewAdjustmentPage;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconTrash,
  IconLoader2,
  IconArrowLeft,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface Supplier {
  id: string;
  label: string;
}

interface Product {
  id: string;
  label: string;
  buyingPrice?: number;
}

interface Stock {
  id: string;
  label: string;
}

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

const NewPurchaseOrderPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [stockId, setStockId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([]);

  // Item form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [suppliersRes, productsRes, stocksRes] = await Promise.all([
        axios.get<Supplier[]>("/api/v2/suppliers?dropdown=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Product[]>("/api/v2/master/products/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Stock[]>("/api/v2/master/stocks/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSuppliers(suppliersRes.data);
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

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const supplier = suppliers.find((s) => s.id === id);
    setSupplierName(supplier?.label || "");
  };

  const handleProductChange = (id: string) => {
    setSelectedProduct(id);
    const product = products.find((p) => p.id === id);
    setUnitCost(product?.buyingPrice || 0);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !size || quantity <= 0) {
      showNotification("Please fill all item fields", "warning");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: POItem = {
      productId: product.id,
      productName: product.label,
      size,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSize("");
    setQuantity(1);
    setUnitCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSave = async (status: "draft" | "sent") => {
    if (!supplierId) {
      showNotification("Please select a supplier", "warning");
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
        "/api/v2/purchase-orders",
        {
          supplierId,
          supplierName,
          stockId,
          expectedDate,
          notes,
          items,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification(
        status === "draft" ? "PO saved as draft" : "PO created and sent",
        "success"
      );
      router.push("/inventory/purchase-orders");
    } catch (error) {
      console.error(error);
      showNotification("Failed to create PO", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="New Purchase Order">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New Purchase Order">
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
              New Purchase Order
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Create order to supplier
            </p>
          </div>
        </div>

        {/* Supplier & Details */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Receive to Stock
              </label>
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Select stock location</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Expected Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Add Item - Mobile Stacked */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-900">
              Add Items
            </h3>
          </div>
          <div className="p-4 md:p-6 space-y-3 md:space-y-0 md:grid md:grid-cols-5 md:gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 md:hidden">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
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
            <div className="grid grid-cols-3 gap-3 md:contents">
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
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Cost
                </label>
                <input
                  type="number"
                  placeholder="Cost"
                  min={0}
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div className="md:col-span-5">
              <button
                onClick={handleAddItem}
                className="w-full md:w-auto px-4 py-2.5 bg-black text-white text-xs font-bold uppercase hover:bg-gray-900 flex items-center justify-center gap-2"
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
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Total
                    </th>
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
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        Rs {item.unitCost}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        Rs {item.totalCost.toLocaleString()}
                      </td>
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
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-right font-bold uppercase"
                    >
                      Total
                    </td>
                    <td className="px-6 py-4 text-right font-black text-lg">
                      Rs {totalAmount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-100">
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
                        Size: {item.size} • Qty: {item.quantity} • Rs{" "}
                        {item.unitCost}/unit
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">
                        Rs {item.totalCost.toLocaleString()}
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
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Total
                </span>
                <span className="font-black text-lg">
                  Rs {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row justify-end gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="w-full md:w-auto px-6 py-3 border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader2 size={14} className="animate-spin" />}
            Save as Draft
          </button>
          <button
            onClick={() => handleSave("sent")}
            disabled={saving}
            className="w-full md:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader2 size={14} className="animate-spin" />}
            Create & Send
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default NewPurchaseOrderPage;

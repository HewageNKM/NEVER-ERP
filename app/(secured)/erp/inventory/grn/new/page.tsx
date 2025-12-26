"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft, IconLoader2, IconPackage } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  stockId?: string;
}

interface Stock {
  id: string;
  label: string;
}

interface GRNItemInput {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  previouslyReceived: number;
  unitCost: number;
  stockId: string;
}

const NewGRNPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPOId = searchParams.get("poId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [selectedPOId, setSelectedPOId] = useState(preselectedPOId || "");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [stockId, setStockId] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GRNItemInput[]>([]);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [posRes, stocksRes] = await Promise.all([
        axios.get<PurchaseOrder[]>("/api/v2/purchase-orders?pending=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Stock[]>("/api/v2/master/stocks/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setPendingPOs(posRes.data);
      setStocks(stocksRes.data);

      if (preselectedPOId) {
        const po = posRes.data.find((p) => p.id === preselectedPOId);
        if (po) loadPOItems(po);
      }
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

  const loadPOItems = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setStockId(po.stockId || (stocks.length > 0 ? stocks[0].id : ""));

    const grnItems: GRNItemInput[] = po.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      size: item.size,
      orderedQuantity: item.quantity,
      previouslyReceived: item.receivedQuantity || 0,
      receivedQuantity: item.quantity - (item.receivedQuantity || 0),
      unitCost: item.unitCost,
      stockId: po.stockId || "",
    }));

    setItems(grnItems);
  };

  const handlePOChange = (poId: string) => {
    setSelectedPOId(poId);
    const po = pendingPOs.find((p) => p.id === poId);
    if (po) {
      loadPOItems(po);
    } else {
      setSelectedPO(null);
      setItems([]);
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const remaining =
      items[index].orderedQuantity - items[index].previouslyReceived;
    const qty = Math.max(0, Math.min(value, remaining));

    setItems(
      items.map((item, i) =>
        i === index ? { ...item, receivedQuantity: qty } : item
      )
    );
  };

  const handleStockChange = (index: number, value: string) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, stockId: value } : item))
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0
  );

  const handleSave = async () => {
    if (!selectedPO) {
      showNotification("Please select a purchase order", "warning");
      return;
    }

    const validItems = items.filter((item) => item.receivedQuantity > 0);
    if (validItems.length === 0) {
      showNotification("Please enter received quantities", "warning");
      return;
    }

    for (const item of validItems) {
      if (!item.stockId) {
        showNotification(
          `Please select stock location for ${item.productName}`,
          "warning"
        );
        return;
      }
    }

    setSaving(true);
    try {
      const token = await getToken();
      await axios.post(
        "/api/v2/grn",
        {
          purchaseOrderId: selectedPO.id,
          poNumber: selectedPO.poNumber,
          supplierId: selectedPO.supplierId,
          supplierName: selectedPO.supplierName,
          receivedDate,
          notes,
          items: validItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            variantName: item.variantName,
            size: item.size,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            unitCost: item.unitCost,
            totalCost: item.receivedQuantity * item.unitCost,
            stockId: item.stockId,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification("GRN created and inventory updated", "success");
      router.push("/erp/inventory/grn");
    } catch (error) {
      console.error(error);
      showNotification("Failed to create GRN", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="New GRN">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New GRN">
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
              Receive Goods
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Create goods received note
            </p>
          </div>
        </div>

        {/* PO Selection */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Purchase Order *
              </label>
              <select
                value={selectedPOId}
                onChange={(e) => handlePOChange(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Select PO</option>
                {pendingPOs.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplierName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 md:mb-2">
                Received Date
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
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
                placeholder="Optional"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        {selectedPO && items.length > 0 && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-900">
                Enter Received Quantities
              </h3>
            </div>

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
                      Ordered
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Prev
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-center">
                      Receiving
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const remaining =
                      item.orderedQuantity - item.previouslyReceived;
                    return (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4">{item.size}</td>
                        <td className="px-6 py-4 text-right">
                          {item.orderedQuantity}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {item.previouslyReceived}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={item.receivedQuantity}
                            onChange={(e) =>
                              handleQuantityChange(idx, Number(e.target.value))
                            }
                            className="w-20 mx-auto block px-2 py-1 border border-gray-300 text-center focus:outline-none focus:border-black"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.stockId}
                            onChange={(e) =>
                              handleStockChange(idx, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          >
                            <option value="">Select</option>
                            {stocks.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          Rs{" "}
                          {(
                            item.receivedQuantity * item.unitCost
                          ).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-right font-bold uppercase"
                    >
                      Total Value
                    </td>
                    <td className="px-6 py-4 text-right font-black text-lg">
                      Rs {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item, idx) => {
                const remaining =
                  item.orderedQuantity - item.previouslyReceived;
                return (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Size: {item.size} • Ordered: {item.orderedQuantity} •
                          Prev: {item.previouslyReceived}
                        </p>
                      </div>
                      <p className="font-bold text-sm">
                        Rs{" "}
                        {(
                          item.receivedQuantity * item.unitCost
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Receiving
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            handleQuantityChange(idx, Number(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Stock
                        </label>
                        <select
                          value={item.stockId}
                          onChange={(e) =>
                            handleStockChange(idx, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        >
                          <option value="">Select</option>
                          {stocks.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Total Value
                </span>
                <span className="font-black text-lg">
                  Rs {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedPO && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto px-6 md:px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconPackage size={14} />
              )}
              Create GRN & Update Inventory
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

const NewGRNPage = () => {
  return (
    <Suspense
      fallback={
        <PageContainer title="New GRN">
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        </PageContainer>
      }
    >
      <NewGRNPageContent />
    </Suspense>
  );
};

export default NewGRNPage;

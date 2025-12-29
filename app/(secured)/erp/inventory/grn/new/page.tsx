"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconLoader2,
  IconPackage,
  IconShoppingCart,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md disabled:opacity-50",
  secondaryBtn:
    "flex items-center justify-center px-6 py-4 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm disabled:opacity-50",
};

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
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [selectedPOId, setSelectedPOId] = useState(preselectedPOId || "");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Default fields
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
    // Use PO's stock ID as default for items update if logic permits,
    // but individual items might go to different stocks conceptually.
    // Here we'll default all items to the PO's preferred stock or the first available one.
    const defaultStockId =
      po.stockId || (stocks.length > 0 ? stocks[0].id : "");

    const grnItems: GRNItemInput[] = po.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      size: item.size,
      orderedQuantity: item.quantity,
      previouslyReceived: item.receivedQuantity || 0,
      receivedQuantity: item.quantity - (item.receivedQuantity || 0), // Default to remaining qty
      unitCost: item.unitCost,
      stockId: defaultStockId,
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

    showConfirmation({
      title: "CONFIRM GRN CREATION?",
      message: `Are you sure you want to receive these goods? Total Value: Rs ${totalAmount.toLocaleString()}. This will update inventory levels.`,
      variant: "info",
      onSuccess: async () => {
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

          showNotification("GRN CREATED SUCCESSFULLY", "success");
          router.push("/erp/inventory/grn");
        } catch (error) {
          console.error(error);
          showNotification("Failed to create GRN", "error");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="New GRN">
        <div className="flex flex-col items-center justify-center py-40">
          <ComponentsLoader />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4">
            Loading Pending Orders
          </span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New GRN">
      <div className="w-full space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-black hover:text-white transition-colors"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconShoppingCart size={14} /> Procurement
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-black leading-none">
              Receive Goods (GRN)
            </h2>
          </div>
        </div>

        {/* PO Selection & Details */}
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-100 pb-2">
            Order Selection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={styles.label}>
                Purchase Order <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPOId}
                onChange={(e) => handlePOChange(e.target.value)}
                className={styles.select}
              >
                <option value="">SELECT PENDING ORDER</option>
                {pendingPOs.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplierName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Received Date</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="OPTIONAL..."
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        {selectedPO && items.length > 0 && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                Receive Items
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4 text-center">Size</th>
                    <th className="px-6 py-4 text-right">Ordered</th>
                    <th className="px-6 py-4 text-right">Prev</th>
                    <th className="px-6 py-4 text-center">Receiving</th>
                    <th className="px-6 py-4 text-center">Location</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {items.map((item, idx) => {
                    const remaining =
                      item.orderedQuantity - item.previouslyReceived;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-black uppercase">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 text-gray-600 uppercase text-xs">
                          {item.variantName || "-"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs">
                          {item.size}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          {item.orderedQuantity}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 font-mono">
                          {item.previouslyReceived}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min={0}
                              max={remaining}
                              value={item.receivedQuantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  idx,
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 bg-white border-2 border-gray-200 focus:border-black px-3 py-2 text-center font-bold outline-none transition-colors rounded-sm"
                            />
                            <span className="ml-2 text-xs text-gray-400 font-bold">
                              / {remaining}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.stockId}
                            onChange={(e) =>
                              handleStockChange(idx, e.target.value)
                            }
                            className="w-full bg-white border-2 border-gray-200 focus:border-black px-2 py-2 text-xs font-medium outline-none transition-colors rounded-sm uppercase"
                          >
                            <option value="">Select</option>
                            {stocks.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-black">
                          Rs{" "}
                          {(
                            item.receivedQuantity * item.unitCost
                          ).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-black">
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-right font-bold uppercase tracking-widest text-xs"
                    >
                      Total GRN Value
                    </td>
                    <td className="px-6 py-4 text-right font-black text-xl">
                      Rs {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Action Panel */}
        {selectedPO && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.primaryBtn}
            >
              {saving ? (
                <IconLoader2 size={18} className="animate-spin mr-2" />
              ) : (
                <IconPackage size={18} className="mr-2" />
              )}
              CONFIRM RECEIPT & UPDATE INVENTORY
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

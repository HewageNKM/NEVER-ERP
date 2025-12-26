"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPackage,
  IconLoader2,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useParams } from "next/navigation";

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
  status: string;
  totalAmount: number;
  expectedDate?: string;
  stockId?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-yellow-100 text-yellow-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent to Supplier",
  partial: "Partially Received",
  received: "Fully Received",
  cancelled: "Cancelled",
};

const ViewPurchaseOrderPage = () => {
  const router = useRouter();
  const params = useParams();
  const poId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [po, setPO] = useState<PurchaseOrder | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<PurchaseOrder>(
        `/api/v2/purchase-orders/${poId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPO(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch purchase order", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && poId) fetchPO();
  }, [currentUser, poId]);

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const token = await getToken();
      await axios.put(
        `/api/v2/purchase-orders/${poId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification("Status updated", "success");
      fetchPO();
    } catch (error) {
      console.error(error);
      showNotification("Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  if (!po) {
    return (
      <PageContainer title="Purchase Order">
        <div className="text-center py-20 text-gray-500">
          Purchase order not found
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={po.poNumber}>
      <div className="w-full space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <IconArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
                {po.poNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{po.supplierName}</p>
            </div>
          </div>
          <span
            className={`px-4 py-2 text-sm font-bold uppercase ${
              STATUS_COLORS[po.status] || "bg-gray-100"
            }`}
          >
            {STATUS_LABELS[po.status] || po.status}
          </span>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Supplier
              </p>
              <p className="font-medium text-gray-900">{po.supplierName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Expected
              </p>
              <p className="font-medium text-gray-900">
                {po.expectedDate || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Total</p>
              <p className="font-bold text-gray-900 text-lg">
                Rs {po.totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Notes</p>
              <p className="text-gray-600">{po.notes || "-"}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Items
            </h3>
          </div>
          <div className="overflow-x-auto">
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
                    Received
                  </th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 font-bold tracking-wider text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {po.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4">{item.size}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={
                          (item.receivedQuantity || 0) >= item.quantity
                            ? "text-green-600 font-bold"
                            : ""
                        }
                      >
                        {item.receivedQuantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">Rs {item.unitCost}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs {item.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {po.status === "draft" && (
            <>
              <button
                onClick={() => handleUpdateStatus("sent")}
                disabled={updating}
                className="px-6 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <IconSend size={14} />
                )}
                Send to Supplier
              </button>
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating}
                className="px-6 py-3 border border-red-300 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <IconX size={14} />
                Cancel
              </button>
            </>
          )}
          {(po.status === "sent" || po.status === "partial") && (
            <Link
              href={`/inventory/grn/new?poId=${po.id}`}
              className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 flex items-center justify-center gap-2"
            >
              <IconPackage size={14} />
              Receive Goods (GRN)
            </Link>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewPurchaseOrderPage;

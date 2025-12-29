"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconAdjustments,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_COLORS,
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName?: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  adjustedBy?: string;
  status: AdjustmentStatus;
  createdAt: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-100 text-green-800",
  remove: "bg-red-100 text-red-800",
  damage: "bg-orange-100 text-orange-800",
  return: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

const ViewAdjustmentPage = () => {
  const router = useRouter();
  const params = useParams();
  const adjustmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);

  const { showConfirmation } = useConfirmationDialog();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustment = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<Adjustment>(
        `/api/v2/inventory/adjustments/${adjustmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdjustment(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch adjustment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (status: AdjustmentStatus) => {
    const isApproved = status === "APPROVED";

    showConfirmation({
      title: `Confirm ${status.toLowerCase()}`,
      message: `Are you sure you want to ${status.toLowerCase()} this adjustment? ${
        isApproved ? "This will update your inventory levels." : ""
      }`,
      variant:
        status === "REJECTED" ? "danger" : isApproved ? "default" : "warning",
      confirmText:
        status === "APPROVED"
          ? "Approve"
          : status === "REJECTED"
          ? "Reject"
          : "Confirm",
      onSuccess: async () => {
        try {
          const token = await getToken();
          await axios.put(
            `/api/v2/inventory/adjustments/${adjustmentId}/status`,
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showNotification(`Adjustment ${status.toLowerCase()}`, "success");
          fetchAdjustment(); // Refresh data
        } catch (error) {
          console.error(error);
          showNotification("Failed to update status", "error");
        }
      },
    });
  };

  useEffect(() => {
    if (currentUser && adjustmentId) fetchAdjustment();
  }, [currentUser, adjustmentId]);

  if (loading) {
    return (
      <PageContainer title="Adjustment">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  if (!adjustment) {
    return (
      <PageContainer title="Adjustment">
        <div className="text-center py-20 text-gray-500">
          Adjustment not found
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={adjustment.adjustmentNumber}>
      <div className="w-full space-y-6">
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
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
                  {adjustment.adjustmentNumber}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    ADJUSTMENT_STATUS_COLORS[adjustment.status] || "bg-gray-100"
                  }`}
                >
                  {ADJUSTMENT_STATUS_LABELS[adjustment.status] ||
                    adjustment.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{adjustment.reason}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-4 py-2 text-xs font-bold uppercase ${
                TYPE_COLORS[adjustment.type] || "bg-gray-100"
              }`}
            >
              {TYPE_LABELS[adjustment.type] || adjustment.type}
            </span>

            {adjustment.status === "SUBMITTED" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("REJECTED")}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 flex items-center gap-2"
                >
                  <IconX size={14} />
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus("APPROVED")}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700 flex items-center gap-2"
                >
                  <IconCheck size={14} />
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Type</p>
              <p className="font-medium text-gray-900">
                {TYPE_LABELS[adjustment.type]}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Reason
              </p>
              <p className="font-medium text-gray-900">{adjustment.reason}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Total Items
              </p>
              <p className="font-bold text-gray-900 text-lg">
                {adjustment.items?.length || 0}
              </p>
            </div>
          </div>
          {adjustment.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold uppercase text-gray-500">Notes</p>
              <p className="text-gray-600">{adjustment.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-900">
              Adjusted Items
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
                    Quantity
                  </th>
                  <th className="px-6 py-3 font-bold tracking-wider">Stock</th>
                  {adjustment.type === "transfer" && (
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Destination
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustment.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.productName}
                      {item.variantName && (
                        <span className="block text-xs text-gray-500 font-normal">
                          {item.variantName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{item.size}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-bold ${
                          adjustment.type === "add" ||
                          adjustment.type === "return"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {adjustment.type === "add" ||
                        adjustment.type === "return"
                          ? "+"
                          : "-"}
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.stockName || item.stockId}
                    </td>
                    {adjustment.type === "transfer" && (
                      <td className="px-6 py-4">
                        {item.destinationStockName || item.destinationStockId}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {adjustment.items?.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.size}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      adjustment.type === "add" || adjustment.type === "return"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {adjustment.type === "add" || adjustment.type === "return"
                      ? "+"
                      : "-"}
                    {item.quantity}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <span>{item.stockName || item.stockId}</span>
                  {adjustment.type === "transfer" && (
                    <>
                      <span>→</span>
                      <span>
                        {item.destinationStockName || item.destinationStockId}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewAdjustmentPage;

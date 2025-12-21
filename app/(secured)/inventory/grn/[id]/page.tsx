"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface GRNItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  stockId: string;
}

interface GRN {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalAmount: number;
  notes?: string;
  receivedBy?: string;
  receivedDate: string;
  inventoryUpdated: boolean;
}

const ViewGRNPage = () => {
  const router = useRouter();
  const params = useParams();
  const grnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [grn, setGRN] = useState<GRN | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRN = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<GRN>(`/api/v2/grn/${grnId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGRN(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch GRN", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && grnId) fetchGRN();
  }, [currentUser, grnId]);

  if (loading) {
    return (
      <PageContainer title="GRN">
        <div className="flex justify-center py-20">
          <ComponentsLoader />
        </div>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN">
        <div className="text-center py-20 text-gray-500">GRN not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={grn.grnNumber}>
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
                {grn.grnNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                PO: {grn.poNumber} | {grn.supplierName}
              </p>
            </div>
          </div>
          {grn.inventoryUpdated && (
            <span className="px-4 py-2 bg-green-100 text-green-800 text-xs font-bold uppercase flex items-center gap-2">
              <IconCheck size={14} />
              Inventory Updated
            </span>
          )}
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Supplier
              </p>
              <p className="font-medium text-gray-900">{grn.supplierName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                PO Number
              </p>
              <p className="font-mono font-medium text-gray-900">
                {grn.poNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Received Date
              </p>
              <p className="font-medium text-gray-900">{grn.receivedDate}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Total Value
              </p>
              <p className="font-bold text-gray-900 text-lg">
                Rs {grn.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {grn.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold uppercase text-gray-500">Notes</p>
              <p className="text-gray-600">{grn.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Received Items
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
                {grn.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4">{item.size}</td>
                    <td className="px-6 py-4 text-right">
                      {item.orderedQuantity}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {item.receivedQuantity}
                    </td>
                    <td className="px-6 py-4 text-right">Rs {item.unitCost}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs {item.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-right font-bold uppercase"
                  >
                    Total
                  </td>
                  <td className="px-6 py-4 text-right font-black text-lg">
                    Rs {grn.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewGRNPage;

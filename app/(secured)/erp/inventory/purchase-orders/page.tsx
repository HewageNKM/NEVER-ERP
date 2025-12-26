"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconPlus, IconEye, IconSearch, IconFilter } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedDate?: string;
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
  sent: "Sent",
  partial: "Partial",
  received: "Received",
  cancelled: "Cancelled",
};

const PurchaseOrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get<PurchaseOrder[]>("/api/v2/purchase-orders", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch purchase orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [currentUser, statusFilter]);

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Purchase Orders">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Purchase Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage orders to suppliers
            </p>
          </div>
          <Link
            href="/erp/inventory/purchase-orders/new"
            className="w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            New PO
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by PO# or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black"
            />
          </div>
          <div className="relative">
            <IconFilter
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black appearance-none min-w-[150px]"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Expected
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900">
                          {po.poNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {po.supplierName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase ${
                            STATUS_COLORS[po.status] || "bg-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[po.status] || po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        Rs {po.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {po.expectedDate || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/inventory/purchase-orders/${po.id}`}
                          className="p-2 hover:bg-gray-100 inline-flex transition-colors"
                        >
                          <IconEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default PurchaseOrdersPage;

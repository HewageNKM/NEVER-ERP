"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconShoppingCart,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from "@/model/PurchaseOrder";

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

// --- NIKE AESTHETIC STYLES ---
const styles = {
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-8 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors",
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
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconShoppingCart size={14} /> Procurement
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Purchase Orders
            </h2>
          </div>
          <Link
            href="/erp/inventory/purchase-orders/new"
            className={styles.primaryBtn}
          >
            <IconPlus size={16} className="mr-2" />
            New Order
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="SEARCH ORDERS OR SUPPLIERS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className="relative min-w-[200px]">
              <IconFilter
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.select}
              >
                <option value="">ALL STATUS</option>
                <option value="draft">DRAFT</option>
                <option value="sent">SENT</option>
                <option value="partial">PARTIAL</option>
                <option value="received">RECEIVED</option>
                <option value="cancelled">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <ComponentsLoader />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4">
              Loading Orders
            </span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="px-6 py-5">PO Number</th>
                    <th className="px-6 py-5">Supplier</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-right">Amount</th>
                    <th className="px-6 py-5 text-right">Expected</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest"
                      >
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <span className="font-mono font-bold text-black text-xs uppercase tracking-wide">
                            {po.poNumber}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-700 uppercase text-xs tracking-wide">
                          {po.supplierName}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                              PO_STATUS_COLORS[po.status] ||
                              "bg-gray-100 border-gray-200"
                            }`}
                          >
                            {PO_STATUS_LABELS[po.status] || po.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-black">
                          Rs {po.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right text-gray-500 text-xs font-bold uppercase">
                          {po.expectedDate || "-"}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                            <Link
                              href={`/erp/inventory/purchase-orders/${po.id}`}
                              className={styles.iconBtn}
                              title="View Details"
                            >
                              <IconEye size={16} stroke={2} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
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

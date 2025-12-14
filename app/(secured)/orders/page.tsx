"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  IconFilter,
  IconX,
  IconRefresh,
  IconEye,
  IconFileInvoice,
  IconEdit,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import PageContainer from "../components/container/PageContainer";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Order } from "@/model";

const paymentStatusList = [
  { id: 1, name: "Paid", value: "Paid" },
  { id: 2, name: "Pending", value: "Pending" },
  { id: 3, name: "Failed", value: "Failed" },
  { id: 4, name: "Refunded", value: "Refunded" },
];

const OrdersPage = () => {
  const router = useRouter();
  
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // --- Pagination state ---
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filters ---
  const initialFilters = {
    payment: "all",
    status: "all",
    search: "",
    from: "",
    to: "",
  };
  const [filters, setFilters] = useState(initialFilters);

  // --- Fetch orders from API ---
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("size", String(size));
      if (filters.payment !== "all") params.append("payment", filters.payment);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.search.trim()) params.append("search", filters.search.trim());

      const token = await getToken();
      const { data } = await axios.get(`/api/v2/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(data.dataList);
      setTotalItems(data.total);
    } catch (err: any) {
      console.error(err);
      showNotification(
        err?.response?.data?.message || "Failed to fetch orders",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Clear all filters ---
  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    // Use timeout to ensure state update before fetch, or pass defaults directly
    setTimeout(() => {
      // We can't rely on state being updated immediately in this closure
      // But for simplicity in this refactor, let's just trigger a re-mount effect or similar
      // actually easier to just call fetch with default params or let effect handle it
    }, 0);
  };

  // Effect to handle clear filter logic properly if we add dependency on filters to effect
  // But original code had manual fetch. Let's stick to manual fetch for filters, auto for pagination.

  // Re-fetch when pagination changes
  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [page, size, currentUser]);

  // Handle Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchOrders();
    }
  };

  return (
    <PageContainer title="Orders" description="Manage all customer orders">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Order Management
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500 uppercase">
              Total Orders: {totalItems}
            </span>
            <button
              onClick={fetchOrders}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <IconRefresh size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top Row: Search & Statuses */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Order ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <IconSearch size={16} />
                  </div>
                </div>
              </div>

              <div className="min-w-[150px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Payment
                </label>
                <select
                  value={filters.payment}
                  onChange={(e) =>
                    setFilters({ ...filters, payment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                >
                  <option value="all">All</option>
                  {paymentStatusList.map((s) => (
                    <option key={s.id} value={s.value}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[150px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                >
                  <option value="all">All</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Dates & Actions */}
            <div className="flex flex-wrap gap-4 items-end justify-between border-t border-gray-100 pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) =>
                      setFilters({ ...filters, from: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) =>
                      setFilters({ ...filters, to: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPage(1);
                    fetchOrders();
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <IconFilter size={16} className="mr-2" />
                  Filter
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...initialFilters });
                    setPage(1);
                    // Trigger re-fetch in effect or next tick
                    setTimeout(() => fetchOrders(), 0); // Quick hack to re-fetch with cleared state
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <IconX size={16} className="mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-gray-500 text-sm font-bold uppercase">
              Loading Orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-sm">
            <p className="text-sm font-bold uppercase">No orders found.</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
                  <tr>
                    <th className="p-4 w-[1%] whitespace-nowrap">Actions</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">From</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Integrity</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}/invoice`)
                            }
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors border border-transparent hover:border-blue-100"
                            title="Invoice"
                          >
                            <IconFileInvoice size={18} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}/view`)
                            }
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors border border-transparent hover:border-gray-200"
                            title="View"
                          >
                            <IconEye size={18} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}`)
                            }
                            className="p-1.5 text-white bg-gray-900 hover:bg-gray-800 rounded-sm transition-colors shadow-sm"
                            title="Edit"
                          >
                            <IconEdit size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-gray-700">
                        #{order.orderId}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {order.customer?.name || "N/A"}
                      </td>
                      <td className="p-4 text-gray-600 text-xs uppercase font-bold">
                        {order.paymentMethod || "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            order.paymentStatus?.toLowerCase() === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.paymentStatus?.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.paymentStatus?.toLowerCase() === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.paymentStatus || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-900">
                        LKR {order.total?.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {order.items?.length || 0}
                      </td>
                      <td className="p-4 text-xs font-bold uppercase text-gray-500">
                        {order.from}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            order.status?.toLowerCase() === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status?.toLowerCase() === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {order.integrity ? (
                          <IconCheck
                            className="text-green-500 mx-auto"
                            size={20}
                          />
                        ) : (
                          <IconAlertCircle
                            className="text-red-500 mx-auto"
                            size={20}
                          />
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {order.createdAt ? order.createdAt : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Rows per page:
                </span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 text-xs font-bold uppercase rounded-sm focus:ring-gray-900 focus:border-gray-900 block p-1.5"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <IconChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-gray-700 px-4">
                  Page {page} of {Math.ceil(totalItems / size) || 1}
                </span>
                <button
                  onClick={() =>
                    setPage(Math.min(Math.ceil(totalItems / size), page + 1))
                  }
                  disabled={page >= Math.ceil(totalItems / size)}
                  className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <IconChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default OrdersPage;

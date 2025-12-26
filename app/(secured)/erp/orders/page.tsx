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
  IconBoxSeam,
  IconLoader,
} from "@tabler/icons-react";
import PageContainer from "../components/container/PageContainer";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Order } from "@/model/Order";

const paymentStatusList = [
  { id: 1, name: "PAID", value: "Paid" },
  { id: 2, name: "PENDING", value: "Pending" },
  { id: 3, name: "FAILED", value: "Failed" },
  { id: 4, name: "REFUNDED", value: "Refunded" },
];

// --- STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
};

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

  // Helper for Status Badges
  const renderStatusBadge = (
    status: string | undefined,
    type: "payment" | "order"
  ) => {
    if (!status)
      return <span className="text-gray-300 font-mono text-xs">N/A</span>;

    const s = status.toLowerCase();
    let styleClass = "bg-gray-100 text-gray-500 border-gray-200";

    if (type === "payment") {
      if (s === "paid") styleClass = "bg-black text-white border-black";
      else if (s === "pending") styleClass = "bg-white text-black border-black";
      else if (s === "failed")
        styleClass = "bg-red-600 text-white border-red-600";
      else if (s === "refunded")
        styleClass = "bg-orange-500 text-white border-orange-500";
    } else {
      if (s === "completed")
        styleClass = "bg-green-600 text-white border-green-600";
      else if (s === "processing")
        styleClass = "bg-blue-600 text-white border-blue-600";
    }

    return (
      <span
        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${styleClass}`}
      >
        {status}
      </span>
    );
  };

  return (
    <PageContainer title="Orders" description="Manage Customer Orders">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-row justify-between items-end gap-4 border-b-2 border-black pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2">
              <IconBoxSeam size={14} /> Order Management
            </span>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                Orders
              </h2>
              <span className="text-xs sm:text-sm font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-sm whitespace-nowrap">
                {totalItems} Total
              </span>
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            title="Refresh List"
          >
            <IconRefresh size={18} stroke={2.5} />
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-4">
              <label className={styles.label}>Order ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="SEARCH ID..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  className={styles.input}
                />
                <IconSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Payment Filter */}
            <div className="md:col-span-2">
              <label className={styles.label}>Payment</label>
              <select
                value={filters.payment}
                onChange={(e) =>
                  setFilters({ ...filters, payment: e.target.value })
                }
                className={styles.select}
              >
                <option value="all">ALL STATUS</option>
                {paymentStatusList.map((s) => (
                  <option key={s.id} value={s.value}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Status Filter */}
            <div className="md:col-span-2">
              <label className={styles.label}>Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className={styles.select}
              >
                <option value="all">ALL STATUS</option>
                <option value="Processing">PROCESSING</option>
                <option value="Completed">COMPLETED</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className={styles.label}>From Date</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
                className={styles.input}
              />
            </div>
            <div className="md:col-span-2">
              <label className={styles.label}>To Date</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className={styles.input}
              />
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-12 flex justify-end gap-2 mt-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setFilters({ ...initialFilters });
                  setPage(1);
                  setTimeout(() => fetchOrders(), 0);
                }}
                disabled={isLoading}
                className={`${styles.secondaryBtn} w-auto px-8`}
              >
                <IconX size={16} className="mr-2" /> Clear
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  fetchOrders();
                }}
                disabled={isLoading}
                className={`${styles.primaryBtn} w-auto px-8`}
              >
                {isLoading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <>
                    <IconFilter size={16} className="mr-2" /> Filter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-gray-200 bg-white">
            <IconLoader className="animate-spin text-black mb-3" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Loading Order Data
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/50">
            <IconBoxSeam className="text-gray-300 mb-2" size={48} />
            <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
              No Orders Found
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full overflow-x-auto bg-white border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="p-6">Actions</th>
                    <th className="p-6">Order Details</th>
                    <th className="p-6">Customer</th>
                    <th className="p-6 text-center">Payment</th>
                    <th className="p-6 text-right">Total</th>
                    <th className="p-6 text-center">Order Status</th>
                    <th className="p-6 text-center">Check</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-6 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}/invoice`)
                            }
                            className={styles.iconBtn}
                            title="Invoice"
                          >
                            <IconFileInvoice size={16} stroke={2} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}/view`)
                            }
                            className={styles.iconBtn}
                            title="View"
                          >
                            <IconEye size={16} stroke={2} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/orders/${order.orderId}`)
                            }
                            className={`${styles.iconBtn} bg-black text-white hover:bg-gray-800 border-black`}
                            title="Edit"
                          >
                            <IconEdit size={16} stroke={2} />
                          </button>
                        </div>
                      </td>

                      {/* Order Details */}
                      <td className="p-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm font-bold text-black uppercase tracking-tight">
                            #{order.orderId}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {order.createdAt || "-"}
                          </span>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                            via {order.from}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-6 align-top">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight">
                            {order.customer?.name || "N/A"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                            {order.items?.length || 0} Items
                          </span>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="p-6 align-top text-center">
                        <div className="flex flex-col items-center gap-2">
                          {renderStatusBadge(order.paymentStatus, "payment")}
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {order.paymentMethod || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="p-6 align-top text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-400 mr-1">
                            LKR
                          </span>
                          <span className="font-mono text-lg font-black text-black tracking-tighter">
                            {order.total?.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="p-6 align-top text-center">
                        {renderStatusBadge(order.status, "order")}
                      </td>

                      {/* Integrity Check */}
                      <td className="p-6 align-top text-center">
                        {order.integrity ? (
                          <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-200">
                            <IconCheck
                              className="text-green-600"
                              size={14}
                              stroke={3}
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-200">
                            <IconAlertCircle
                              className="text-red-600"
                              size={14}
                              stroke={3}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Rows:
                </span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-[#f5f5f5] text-black text-xs font-bold uppercase rounded-sm border-transparent focus:ring-0 focus:border-black cursor-pointer py-1 pl-2 pr-6"
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
                  className={styles.iconBtn}
                >
                  <IconChevronLeft size={18} />
                </button>

                <div className="px-6 font-black text-sm tracking-widest uppercase">
                  PAGE {page} <span className="text-gray-400">/</span>{" "}
                  {Math.ceil(totalItems / size) || 1}
                </div>

                <button
                  onClick={() =>
                    setPage(Math.min(Math.ceil(totalItems / size), page + 1))
                  }
                  disabled={page >= Math.ceil(totalItems / size)}
                  className={styles.iconBtn}
                >
                  <IconChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default OrdersPage;

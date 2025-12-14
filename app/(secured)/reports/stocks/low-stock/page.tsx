"use client";

import React, { useEffect, useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import { useAppSelector } from "@/lib/hooks";

const LowStockPage = () => {
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState("all");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });

  const { currentUser } = useAppSelector((state) => state.authSlice);

  const totalPages = Math.ceil(stock.length / rowsPerPage);

  // Fetch stock dropdown
  const fetchStocksDropdown = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/master/stocks/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStocksDropdown([
        { id: "all", label: "All Stocks" },
        ...(res.data || []),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all low-stock items at once
  const fetchStock = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/stocks/low-stock", {
        params: { threshold, stockId: selectedStock },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.stock || [];
      setStock(data);

      setSummary({
        totalProducts: data.length,
        totalQuantity: data.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0
        ),
        totalValuation: data.reduce(
          (sum: number, s: any) => sum + (s.buyingPrice || 0) * s.quantity,
          0
        ),
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) fetchStocksDropdown();
  }, [currentUser]);

  const handleApply = () => {
    setPage(0);
    fetchStock();
  };

  const exportExcel = () => {
    if (!stock.length) return;
    const data = stock.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock ID": s.stockId,
      "Stock Name": s.stockName,
      Quantity: s.quantity,
      Threshold: s.threshold,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Low Stock");
    XLSX.writeFile(wb, "low_stock.xlsx");
  };

  // Frontend pagination: visible rows
  const visibleRows = stock.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const SummaryCard = ({
    title,
    value,
  }: {
    title: string;
    value: string | number;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {title}
      </p>
      <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  return (
    <PageContainer title="Low Stock">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Low Stock Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Products and variants with stock below threshold.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
              <input
                type="number"
                placeholder="Threshold"
                value={threshold}
                onChange={(e) =>
                  setThreshold(parseInt(e.target.value, 10) || 0)
                }
                min={0}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-24"
              />

              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 min-w-[200px]"
              >
                {stocksDropdown.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleApply}
                className="px-6 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors min-w-[100px] flex items-center justify-center gap-2"
              >
                <IconFilter size={16} />
                Apply
              </button>
            </div>

            <button
              onClick={exportExcel}
              disabled={!stock.length}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-900 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <IconDownload size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Total Products"
                value={summary.totalProducts}
              />
              <SummaryCard
                title="Total Quantity"
                value={summary.totalQuantity}
              />
              <SummaryCard
                title="Total Valuation"
                value={`Rs ${summary.totalValuation.toFixed(2)}`}
              />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Variant ID
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Variant Name
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Stock ID
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Stock Name
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Quantity
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Threshold
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No low stock items
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((s, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-400">
                            {s.productId}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {s.productName}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {s.variantId}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {s.variantName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{s.size}</td>
                          <td className="px-6 py-4 text-gray-400">
                            {s.stockId}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {s.stockName}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-red-600">
                            {s.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {s.threshold}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {stock.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(0);
                      }}
                      className="bg-white border border-gray-300 rounded-sm px-2 py-1 focus:outline-none focus:border-gray-900"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {page * rowsPerPage + 1}-
                      {Math.min((page + 1) * rowsPerPage, stock.length)} of{" "}
                      {stock.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="p-1 rounded-sm hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <IconChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setPage(Math.min(totalPages - 1, page + 1))
                        }
                        disabled={page >= totalPages - 1}
                        className="p-1 rounded-sm hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <IconChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default LowStockPage;

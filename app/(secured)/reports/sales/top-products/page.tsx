"use client";
import React, { useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";

const TopSellingProductsPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [threshold, setThreshold] = useState("");
  

  const fetchReport = async (evt: any) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/top-products", {
        params: { from, to, threshold },
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedProducts: any[] = res.data.topProducts || [];

      setProducts(fetchedProducts);
      setPage(0);
    } catch (e) {
      console.error(e);
      showNotification("Failed to fetch top products", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!products.length) return;

    const exportData = products.map((p) => ({
      "Product ID": p.productId,
      Name: p.name,
      "Variant Name": p.variantName,
      "Total Quantity Sold": p.totalQuantity,
      "Total Sales (Rs)": p.totalSales.toFixed(2),
      "Total Net Sale": p.totalNetSales.toFixed(2),
      "Total COGS (Rs)": (p.totalCOGS || 0).toFixed(2),
      "Total Profit (Rs)": (p.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (p.grossProfitMargin || 0).toFixed(2),
      "Total Discount (Rs)": p.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Selling Products");
    XLSX.writeFile(
      wb,
      `top_selling_products_${from || "all"}_${to || "all"}.xlsx`
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(products.length / rowsPerPage);
  const paginatedProducts = products.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <PageContainer title="Top Selling Products">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Top Selling Products
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View most sold products and export data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <form
              onSubmit={fetchReport}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-full sm:w-auto"
                />
                <span className="text-gray-400 font-medium">-</span>
                <input
                  type="date"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-full sm:w-auto"
                />
              </div>
              <input
                type="number"
                placeholder="Limit"
                value={threshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setThreshold(isNaN(val) ? 0 : val);
                }}
                min="0"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-24"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors min-w-[100px] flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <IconFilter size={16} />
                Filter
              </button>
            </form>

            <button
              onClick={exportExcel}
              disabled={!products.length}
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
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">Name</th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Variant
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Qty Sold
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Sales
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Net Sales
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      COGS
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Profit
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Margin
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Discount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map((p, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-400">
                        {p.productId.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {p.variantName}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {p.totalQuantity}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        Rs {(p.totalSales || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        Rs {(p.totalNetSales || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        Rs {(p.totalCOGS || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        Rs {(p.totalGrossProfit || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {(p.grossProfitMargin || 0).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        Rs {(p.totalDiscount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-gray-400 text-sm italic"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {products.length > 0 && (
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
                    {Math.min((page + 1) * rowsPerPage, products.length)} of{" "}
                    {products.length}
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
        )}
      </div>
    </PageContainer>
  );
};

export default TopSellingProductsPage;

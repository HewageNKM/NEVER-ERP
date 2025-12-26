"use client";

import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#E5E7EB",
];

const SalesByCategoryPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchReport = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/by-category", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!categories.length) return;

    const exportData = categories.map((c) => ({
      Category: c.category,
      "Total Orders": c.totalOrders,
      "Total Quantity Sold": c.totalQuantity,
      "Total Sales (Rs)": c.totalSales.toFixed(2),
      "Total Net Sale": c.totalNetSales.toFixed(2),
      "Total COGS (Rs)": (c.totalCOGS || 0).toFixed(2),
      "Total Profit (Rs)": (c.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (c.grossProfitMargin || 0).toFixed(2),
      "Total Discount (Rs)": c.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales by Category");
    XLSX.writeFile(
      wb,
      `sales_by_category_${from || "all"}_${to || "all"}.xlsx`
    );
  };

  return (
    <PageContainer title="Sales by Category">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Sales by Category
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View sales totals aggregated by product category.
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
              disabled={!categories.length}
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
        {!loading && categories.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Sales Comparison
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "4px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                        cursor={{ fill: "#F3F4F6", opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#111827"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalNetSales"
                        name="Net Sale"
                        fill="#22C55E"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDiscount"
                        name="Discount"
                        fill="#EF4444"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Quantity Distribution
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="totalQuantity"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "4px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Orders
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Qty Sold
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Sales
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Net Sale
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
                    {categories.map((c, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {c.category}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {c.totalOrders}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {c.totalQuantity}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          Rs {(c.totalSales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          Rs {(c.totalNetSales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          Rs {(c.totalCOGS || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          Rs {(c.totalGrossProfit || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {(c.grossProfitMargin || 0).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          Rs {(c.totalDiscount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SalesByCategoryPage;

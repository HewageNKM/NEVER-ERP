"use client";
import React, { useState, useEffect } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const MAX_RANGE_DAYS = 31;

const Page = () => {
  const [from, setFrom] = useState(new Date().toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();

    // --- Date range validation (max 31 days) ---
    const start = new Date(from);
    const end = new Date(to);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      showNotification("'To' date must be after 'From' date", "error");
      return;
    }

    if (diffDays > MAX_RANGE_DAYS) {
      showNotification(`Max allowed range is ${MAX_RANGE_DAYS} days`, "error");
      return;
    }
    // ----------------------------------------------------

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/daily-summary", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
    } catch (e: any) {
      console.log(e);
      showNotification(e.message || "Failed to fetch report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!summary?.daily || summary.daily.length === 0) return;

    const exportData = summary.daily.map((d: any) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Total Sales (Rs)": d.sales.toFixed(2),
      "Total Net Sales": d.netSales.toFixed(2),
      "Total COGS (Rs)": (d.cogs || 0).toFixed(2),
      "Total Gross Profit (Rs)": (d.grossProfit || 0).toFixed(2),
      "Gross Profit Margin (%)": (d.grossProfitMargin || 0).toFixed(2),
      "Avg Order Value (Rs)": (d.averageOrderValue || 0).toFixed(2),
      "Shipping (Rs)": d.shipping.toFixed(2),
      "Discount (Rs)": d.discount.toFixed(2),
      "Transaction Fee (Rs)": d.transactionFee.toFixed(2),
      "Items Sold": d.itemsSold,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Summary");
    XLSX.writeFile(wb, `daily_summary_${from}_${to}.xlsx`);
  };

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
    <PageContainer title="Sales Report" description="Daily Sales Summary">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Daily Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Filter sales by date range (Max 31 days)
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
              onClick={handleExportExcel}
              disabled={!summary?.daily?.length}
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
        {!loading && summary && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Total Orders" value={summary.totalOrders} />
              <SummaryCard
                title="Total Sales"
                value={`Rs ${summary.totalSales.toFixed(2)}`}
              />
              <SummaryCard
                title="Net Sales"
                value={`Rs ${summary.totalNetSales.toFixed(2)}`}
              />
              <SummaryCard title="Items Sold" value={summary.totalItemsSold} />
              <SummaryCard
                title="Gross Profit"
                value={`Rs ${(summary.totalGrossProfit || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Profit Margin"
                value={`${(summary.totalGrossProfitMargin || 0).toFixed(2)}%`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`Rs ${(summary.averageOrderValue || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Shipping"
                value={`Rs ${summary.totalShipping.toFixed(2)}`}
              />
            </div>

            {/* Charts Section */}
            {summary.daily && summary.daily.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Daily Sales Trend
                  </h3>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.daily}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="date"
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
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ stroke: "#9CA3AF", strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#111827", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#111827" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Daily Items Sold
                  </h3>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.daily}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          allowDecimals={false}
                          width={40}
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
                        <Bar
                          dataKey="itemsSold"
                          name="Items"
                          fill="#111827"
                          radius={[2, 2, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Orders
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
                        Items
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Shipping
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.daily?.map((d: any, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {d.date}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {d.orders}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          Rs {d.sales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          Rs {d.netSales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          Rs {(d.cogs || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          Rs {(d.grossProfit || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {d.itemsSold}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          Rs {d.shipping.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!summary?.daily?.length && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No data available for the selected period
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

export default Page;

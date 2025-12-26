"use client";

import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import * as XLSX from "xlsx";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
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

const YearRevenuePage = () => {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [yearly, setYearly] = useState<any[]>([]);

  const fetchReport = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = await getToken();
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await axios.get("/api/v2/reports/revenues/yearly-revenue", {
        params: { from: fromDate, to: toDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
      setYearly(res.data.yearly || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!yearly?.length) return;

    const exportData: any[] = yearly.map((y: any) => ({
      Year: y.year,
      "Total Orders": y.totalOrders,
      "Total Sales (Rs)": y.totalSales.toFixed(2),
      "Net Sales (Rs)": y.totalNetSales.toFixed(2),
      "COGS (Rs)": y.totalCOGS.toFixed(2),
      "Total Discount (Rs)": y.totalDiscount.toFixed(2),
      "Transaction Fee (Rs)": y.totalTransactionFee.toFixed(2),
      "Total Expenses (Rs)": y.totalExpenses.toFixed(2),
      "Other Income (Rs)": y.totalOtherIncome.toFixed(2),
      "Gross Profit (Rs)": y.grossProfit.toFixed(2),
      "Gross Margin (%)": y.grossProfitMargin.toFixed(2),
      "Net Profit (Rs)": y.netProfit.toFixed(2),
      "Net Margin (%)": y.netProfitMargin.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Revenue");
    XLSX.writeFile(wb, `yearly_revenue_${from}_${to}.xlsx`);
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
    <PageContainer title="Yearly Revenue Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Yearly Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Select year range to view yearly revenue, gross/net profit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <form
              onSubmit={fetchReport}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  placeholder="From Year"
                  required
                  min="2000"
                  max="2100"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-28"
                />
                <span className="text-gray-400 font-medium">-</span>
                <input
                  type="number"
                  placeholder="To Year"
                  required
                  min="2000"
                  max="2100"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-28"
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
              disabled={!yearly?.length}
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
            {/* Summary Cards */}
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
              <SummaryCard
                title="COGS"
                value={`Rs ${summary.totalCOGS.toFixed(2)}`}
              />
              <SummaryCard
                title="Total Discount"
                value={`Rs ${summary.totalDiscount.toFixed(2)}`}
              />
              <SummaryCard
                title="Transaction Fee"
                value={`Rs ${summary.totalTransactionFee.toFixed(2)}`}
              />
              <SummaryCard
                title="Total Expenses"
                value={`Rs ${summary.totalExpenses.toFixed(2)}`}
              />
              <SummaryCard
                title="Other Income"
                value={`Rs ${summary.totalOtherIncome.toFixed(2)}`}
              />
              <SummaryCard
                title="Gross Profit"
                value={`Rs ${summary.grossProfit.toFixed(2)}`}
              />
              <SummaryCard
                title="Gross Margin"
                value={`${summary.grossProfitMargin.toFixed(2)}%`}
              />
              <SummaryCard
                title="Net Profit"
                value={`Rs ${summary.netProfit.toFixed(2)}`}
              />
              <SummaryCard
                title="Net Margin"
                value={`${summary.netProfitMargin.toFixed(2)}%`}
              />
            </div>

            {/* Charts */}
            {yearly?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Gross & Net Profit Trend
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="year"
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
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalSales"
                          name="Total Sales"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#22C55E"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Orders Per Year
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
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
                        <Legend />
                        <Bar
                          dataKey="totalOrders"
                          name="Total Orders"
                          fill="#111827"
                          radius={[2, 2, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Orders
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Net Sales
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        COGS
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Gross Profit
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Margin
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Net Profit
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Net Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!yearly?.length ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No data available
                        </td>
                      </tr>
                    ) : (
                      yearly.map((y: any) => (
                        <tr
                          key={y.year}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {y.year}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {y.totalOrders}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            Rs {y.totalSales.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            Rs {y.totalNetSales.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            Rs {y.totalCOGS.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-green-600">
                            Rs {y.grossProfit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {y.grossProfitMargin.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-blue-600">
                            Rs {y.netProfit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {y.netProfitMargin.toFixed(2)}%
                          </td>
                        </tr>
                      ))
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

export default YearRevenuePage;

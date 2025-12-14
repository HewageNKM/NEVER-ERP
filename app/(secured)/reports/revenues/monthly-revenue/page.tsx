"use client";

import React, { useState, useEffect } from "react";
import {
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import { showNotification } from "@/utils/toast";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface MonthlyRow {
  month?: string;
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

interface SummaryType {
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

const MAX_MONTH_RANGE = 12;

export default function MonthlyRevenuePage() {
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [summary, setSummary] = useState<SummaryType | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  const getMonthStart = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    return `${y}-${m}-01`;
  };

  const getMonthEnd = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return `${y}-${m}-${lastDay}`;
  };

  const validateRange = () => {
    if (!from || !to) return "Please select From & To months.";

    const start = new Date(getMonthStart(from));
    const end = new Date(getMonthEnd(to));

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Invalid date range.";

    if (start > end) return "From month cannot be after To month.";

    const diffMonths =
      end.getFullYear() * 12 +
      end.getMonth() -
      (start.getFullYear() * 12 + start.getMonth());

    if (diffMonths > MAX_MONTH_RANGE)
      return `Maximum range is ${MAX_MONTH_RANGE} months.`;

    return null;
  };

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();

    const err = validateRange();
    if (err) {
      showNotification(err, "warning");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.get("/api/v2/reports/revenues/monthly-revenue", {
        params: {
          from: getMonthStart(from),
          to: getMonthEnd(to),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows(Array.isArray(res.data?.monthly) ? res.data.monthly : []);
      setSummary(res.data?.summary || null);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const safeMoney = (v?: number) => `Rs ${Number(v ?? 0).toFixed(2)}`;
  const safePercent = (v?: number) => `${Number(v ?? 0).toFixed(2)}%`;

  const SummaryCard = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </p>
      <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  return (
    <PageContainer title="Monthly Revenue Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Monthly Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View monthly revenue, gross profit, and net profit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <form
              onSubmit={fetchReport}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="month"
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-full sm:w-auto"
                />
                <span className="text-gray-400 font-medium">-</span>
                <input
                  type="month"
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
              <SummaryCard
                label="Total Orders"
                value={summary.totalOrders ?? 0}
              />
              <SummaryCard
                label="Total Sales"
                value={safeMoney(summary.totalSales)}
              />
              <SummaryCard
                label="Net Sales"
                value={safeMoney(summary.totalNetSales)}
              />
              <SummaryCard label="COGS" value={safeMoney(summary.totalCOGS)} />
              <SummaryCard
                label="Total Discount"
                value={safeMoney(summary.totalDiscount)}
              />
              <SummaryCard
                label="Total Trans. Fee"
                value={safeMoney(summary.totalTransactionFee)}
              />
              <SummaryCard
                label="Total Expenses"
                value={safeMoney(summary.totalExpenses)}
              />
              <SummaryCard
                label="Other Income"
                value={safeMoney(summary.totalOtherIncome)}
              />
              <SummaryCard
                label="Gross Profit"
                value={safeMoney(summary.grossProfit)}
              />
              <SummaryCard
                label="Gross Margin"
                value={safePercent(summary.grossProfitMargin)}
              />
              <SummaryCard
                label="Net Profit"
                value={safeMoney(summary.netProfit)}
              />
              <SummaryCard
                label="Net Margin"
                value={safePercent(summary.netProfitMargin)}
              />
            </div>

            {/* Charts Section */}
            {rows.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Revenue vs Profit
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="month"
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
                          stroke="#1976d2"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Cost Breakdown
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="month"
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
                          dataKey="totalDiscount"
                          name="Discount"
                          stackId="a"
                          fill="#FF7043"
                        />
                        <Bar
                          dataKey="totalTransactionFee"
                          name="Transaction Fee"
                          stackId="a"
                          fill="#42A5F5"
                        />
                        <Bar
                          dataKey="totalExpenses"
                          name="Expenses"
                          stackId="a"
                          fill="#66BB6A"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {rows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Month
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
                          Discount
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Trans. Fee
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Expenses
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Other Income
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
                      {rows
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((r, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {r.month ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {r.totalOrders ?? 0}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              {safeMoney(r.totalSales)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalNetSales)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalCOGS)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalDiscount)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalTransactionFee)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalExpenses)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safeMoney(r.totalOtherIncome)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-green-600">
                              {safeMoney(r.grossProfit)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safePercent(r.grossProfitMargin)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-blue-600">
                              {safeMoney(r.netProfit)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {safePercent(r.netProfitMargin)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
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
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {page * rowsPerPage + 1}-
                      {Math.min((page + 1) * rowsPerPage, rows.length)} of{" "}
                      {rows.length}
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
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

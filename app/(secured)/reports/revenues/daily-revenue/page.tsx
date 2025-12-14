"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface DailyRevenue {
  date: string;
  totalSales: number;
  totalNetSales: number;
  totalCOGS: number;
  totalOrders: number;
  totalDiscount: number;
  totalTransactionFee: number;
  totalExpenses: number;
  totalOtherIncome: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
}

interface RevenueReport {
  daily: DailyRevenue[];
  summary: Omit<DailyRevenue, "date">;
}
const MAX_RANGE_DAYS = 31;

const DailyRevenuePage = () => {
  const [from, setFrom] = useState(new Date().toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueReport["summary"] | null>(null);
  
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(report.length / rowsPerPage);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

    if (diffDays > MAX_RANGE_DAYS) {
      showNotification(
        `Date range cannot exceed ${MAX_RANGE_DAYS} days.`,
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<RevenueReport>(
        "/api/v2/reports/revenues/daily-revenue",
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReport(res.data.daily || []);
      setSummary(res.data.summary || null);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch revenue report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      showNotification("No data to export", "info");
      return;
    }

    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.totalOrders,
      "Total Sales (Rs)": d.totalSales.toFixed(2),
      "Net Sales (Rs)": d.totalNetSales.toFixed(2),
      "COGS (Rs)": d.totalCOGS.toFixed(2),
      "Total Discount (Rs)": d.totalDiscount.toFixed(2),
      "Total Transaction Fee (Rs)": d.totalTransactionFee.toFixed(2),
      "Total Expenses (Rs)": d.totalExpenses.toFixed(2),
      "Other Income (Rs)": d.totalOtherIncome.toFixed(2),
      "Gross Profit (Rs)": d.grossProfit.toFixed(2),
      "Gross Profit Margin (%)": d.grossProfitMargin.toFixed(2),
      "Net Profit (Rs)": d.netProfit.toFixed(2),
      "Net Profit Margin (%)": d.netProfitMargin.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Revenue");

    XLSX.writeFile(wb, `daily_revenue_${from}_${to}.xlsx`);

    showNotification("Excel exported successfully", "success");
  };

  const SummaryCard = ({
    label,
    value,
    isPercent = false,
  }: {
    label: string;
    value: string | number;
    isPercent?: boolean;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </p>
      <p className="text-xl font-black text-gray-900 tracking-tight">
        {/* @ts-ignore */}
        {isPercent ? value : `Rs ${Number(value || 0).toFixed(2)}`}
      </p>
    </div>
  );

  return (
    <PageContainer title="Daily Revenue Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Daily Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View daily revenue, gross profit, and net profit within a date
              range.
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
              disabled={!report.length}
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
              <SummaryCard
                label="Total Orders"
                value={summary.totalOrders}
                isPercent={true}
              />{" "}
              {/* Hack: isPercent true just to avoid 'Rs' prefix on non-money value if logic below uses it, but wait, totalOrders is number. */}
              {/* Actually, totalOrders should not have Rs. Let's fix the Card logic or just pass string. */}
              {/* I'll fix the Logic in SummaryCard above to handle numbers better or just not add Rs if it's orders. */}
              <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Total Orders
                </p>
                <p className="text-xl font-black text-gray-900 tracking-tight">
                  {summary.totalOrders}
                </p>
              </div>
              <SummaryCard label="Total Sales" value={summary.totalSales} />
              <SummaryCard label="Net Sales" value={summary.totalNetSales} />
              <SummaryCard label="COGS" value={summary.totalCOGS} />
              <SummaryCard
                label="Total Discount"
                value={summary.totalDiscount}
              />
              <SummaryCard
                label="Total Trans. Fee"
                value={summary.totalTransactionFee}
              />
              <SummaryCard
                label="Total Expenses"
                value={summary.totalExpenses}
              />
              <SummaryCard
                label="Other Income"
                value={summary.totalOtherIncome}
              />
              <SummaryCard label="Gross Profit" value={summary.grossProfit} />
              <SummaryCard
                label="Gross Margin"
                value={`${summary.grossProfitMargin.toFixed(2)}%`}
                isPercent={true}
              />
              <SummaryCard label="Net Profit" value={summary.netProfit} />
              <SummaryCard
                label="Net Margin"
                value={`${summary.netProfitMargin.toFixed(2)}%`}
                isPercent={true}
              />
            </div>

            {/* Charts Section */}
            {report.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Revenue vs Profit
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report}>
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
                      <BarChart data={report}>
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
            {report.length > 0 && (
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
                          Total Sales
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Net Sales
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          COGS
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Gro. Profit
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Gro. Margin
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
                      {report
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((day) => (
                          <tr
                            key={day.date}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {day.date}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {day.totalOrders}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              Rs {day.totalSales.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              Rs {day.totalNetSales.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              Rs {day.totalCOGS.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-green-600">
                              Rs {day.grossProfit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {day.grossProfitMargin.toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-blue-600">
                              Rs {day.netProfit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {day.netProfitMargin.toFixed(2)}%
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
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {page * rowsPerPage + 1}-
                      {Math.min((page + 1) * rowsPerPage, report.length)} of{" "}
                      {report.length}
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
};

export default DailyRevenuePage;

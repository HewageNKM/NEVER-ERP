"use client";

import React, { useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
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

interface DailyCashFlow {
  date: string;
  orders: number;
  cashIn: number;
  transactionFees: number;
  expenses: number;
  netCashFlow: number;
}

interface CashFlowSummary {
  totalOrders: number;
  totalCashIn: number;
  totalTransactionFees: number;
  totalExpenses: number;
  totalNetCashFlow: number;
  daily: DailyCashFlow[];
}

const MAX_RANGE_DAYS = 31;

const CashFlowPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyCashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(report.length / rowsPerPage);

  const fetchReport = async (evt: React.FormEvent) => {
    evt.preventDefault();

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
      const res = await axios.get("/api/v2/reports/cash/cashflow", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });

      setReport(res.data.summary?.daily || []);
      setSummary(res.data.summary || null);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch report", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      showNotification("No data to export", "info");
      return;
    }

    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Cash In (Rs)": d.cashIn.toFixed(2),
      "Transaction Fees (Rs)": d.transactionFees.toFixed(2),
      "Expenses (Rs)": d.expenses.toFixed(2),
      "Net Cash Flow (Rs)": d.netCashFlow.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
    XLSX.writeFile(wb, `cashflow_${from}_${to}.xlsx`);
    showNotification("Excel exported successfully", "success");
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
    <PageContainer title="Cashflow Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Cashflow Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View cash in, transaction fees, and net cash flow within a date
              range (Max {MAX_RANGE_DAYS} days).
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SummaryCard title="Total Orders" value={summary.totalOrders} />
              <SummaryCard
                title="Total Cash In"
                value={`Rs ${(summary.totalCashIn || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Transaction Fees"
                value={`Rs ${(summary.totalTransactionFees || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Total Expenses"
                value={`Rs ${(summary.totalExpenses || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Net Cash Flow"
                value={`Rs ${(summary.totalNetCashFlow || 0).toFixed(2)}`}
              />
            </div>

            {/* Charts */}
            {report.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Cash Flow Trend
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
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
                          dataKey="cashIn"
                          name="Cash In"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netCashFlow"
                          name="Net Cash Flow"
                          stroke="#22C55E"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Fees & Expenses Breakdown
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
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
                          dataKey="transactionFees"
                          name="Transaction Fees"
                          fill="#EF4444"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#F59E0B"
                          radius={[2, 2, 0, 0]}
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
                          Cash In
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Trans. Fee
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Expenses
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Net Cash Flow
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
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {day.date}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {day.orders}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              Rs {day.cashIn.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-red-600">
                              Rs {day.transactionFees.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-orange-600">
                              Rs {day.expenses.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-green-600">
                              Rs {day.netCashFlow.toFixed(2)}
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

export default CashFlowPage;

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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface ExpenseReport {
  period: { from: string; to: string };
  expenses: ExpenseItem[];
  summary: {
    total: number;
    byCategory: { category: string; amount: number; percentage: number }[];
    count: number;
  };
}

const COLORS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#E5E7EB",
];

const ExpenseReportPage = () => {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<ExpenseReport>("/api/v2/reports/expenses", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch expense report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.expenses.length === 0) {
      showNotification("No data to export", "info");
      return;
    }

    const exportData = report.expenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      Status: e.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expense_report_${from}_${to}.xlsx`);
    showNotification("Excel exported successfully", "success");
  };

  const totalPages = report
    ? Math.ceil(report.expenses.length / rowsPerPage)
    : 0;

  return (
    <PageContainer title="Expense Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Expense Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Detailed breakdown of all expenses by category.
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
              disabled={!report?.expenses.length}
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
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Total Expenses
                </p>
                <p className="text-2xl font-black text-red-600">
                  Rs {report.summary.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Transactions
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {report.summary.count}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Avg. Per Transaction
                </p>
                <p className="text-2xl font-black text-gray-900">
                  Rs{" "}
                  {report.summary.count > 0
                    ? Math.round(
                        report.summary.total / report.summary.count
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>

            {/* Chart & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
                  By Category
                </h3>
                {report.summary.byCategory.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.summary.byCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ category, percentage }) =>
                            `${category} (${percentage}%)`
                          }
                          labelLine={false}
                        >
                          {report.summary.byCategory.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `Rs ${value.toLocaleString()}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-20">No expenses</p>
                )}
              </div>

              {/* Category List */}
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Category Breakdown
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {report.summary.byCategory.map((cat, idx) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4"
                          style={{
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        ></div>
                        <span className="font-medium text-gray-900">
                          {cat.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          Rs {cat.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cat.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expense Table */}
            {report.expenses.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Amount
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.expenses
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((exp) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {exp.date}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {exp.category}
                            </td>
                            <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                              {exp.description}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-red-600">
                              Rs {exp.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs font-bold uppercase ${
                                  exp.status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {exp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(0);
                      }}
                      className="bg-white border border-gray-300 rounded-sm px-2 py-1"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">
                      {page * rowsPerPage + 1}-
                      {Math.min(
                        (page + 1) * rowsPerPage,
                        report.expenses.length
                      )}{" "}
                      of {report.expenses.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="p-1 rounded-sm hover:bg-gray-200 disabled:opacity-30"
                      >
                        <IconChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setPage(Math.min(totalPages - 1, page + 1))
                        }
                        disabled={page >= totalPages - 1}
                        className="p-1 rounded-sm hover:bg-gray-200 disabled:opacity-30"
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

export default ExpenseReportPage;

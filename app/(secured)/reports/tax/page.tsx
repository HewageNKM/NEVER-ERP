"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconReceipt2,
  IconSettings,
  IconAlertCircle,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface TaxReportItem {
  date: string;
  orderId: string;
  orderTotal: number;
  taxableAmount: number;
  taxCollected: number;
}

interface TaxReport {
  period: { from: string; to: string };
  transactions: TaxReportItem[];
  summary: {
    totalOrders: number;
    totalSales: number;
    totalTaxableAmount: number;
    totalTaxCollected: number;
    effectiveTaxRate: number;
  };
  taxSettings?: {
    taxEnabled: boolean;
    taxName: string;
    taxRate: number;
  };
}

const TaxReportPage = () => {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TaxReport | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<TaxReport>("/api/v2/reports/tax", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
      setPage(0);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch tax report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.transactions.length === 0) {
      showNotification("No data to export", "info");
      return;
    }

    const exportData = report.transactions.map((t) => ({
      Date: t.date,
      "Order ID": t.orderId,
      "Order Total": t.orderTotal,
      "Taxable Amount": t.taxableAmount,
      "Tax Collected": t.taxCollected,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    XLSX.writeFile(wb, `tax_report_${from}_${to}.xlsx`);
    showNotification("Excel exported successfully", "success");
  };

  const totalPages = report
    ? Math.ceil(report.transactions.length / rowsPerPage)
    : 0;

  return (
    <PageContainer title="Tax Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Tax Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Summary of tax collected on all transactions.
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
              disabled={!report?.transactions.length}
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
            {/* Tax Settings Banner */}
            {report.taxSettings && !report.taxSettings.taxEnabled && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconAlertCircle size={20} className="text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Tax collection is disabled
                    </p>
                    <p className="text-sm text-yellow-600">
                      Configure tax settings to start calculating tax on orders.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings/tax"
                  className="px-4 py-2 bg-yellow-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <IconSettings size={14} />
                  Configure
                </Link>
              </div>
            )}

            {report.taxSettings && report.taxSettings.taxEnabled && (
              <div className="bg-green-50 border border-green-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconReceipt2 size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {report.taxSettings.taxName} @{" "}
                      {report.taxSettings.taxRate}%
                    </p>
                    <p className="text-sm text-green-600">
                      Tax is being calculated on all qualifying orders.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings/tax"
                  className="px-4 py-2 bg-white border border-green-300 text-green-700 text-xs font-bold uppercase tracking-wider hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <IconSettings size={14} />
                  Settings
                </Link>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Total Orders
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {report.summary.totalOrders}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Total Sales
                </p>
                <p className="text-2xl font-black text-gray-900">
                  Rs {report.summary.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Taxable Amount
                </p>
                <p className="text-2xl font-black text-gray-900">
                  Rs {report.summary.totalTaxableAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-black p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconReceipt2 size={16} className="text-gray-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tax Collected
                  </p>
                </div>
                <p className="text-2xl font-black text-white">
                  Rs {report.summary.totalTaxCollected.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Effective Tax Rate
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {report.summary.effectiveTaxRate}%
                </p>
              </div>
            </div>

            {/* Transaction Table */}
            {report.transactions.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Transaction Details
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Order Total
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Taxable Amount
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Tax Collected
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.transactions
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((t, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {t.date}
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                              {t.orderId}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900">
                              Rs {t.orderTotal.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              Rs {t.taxableAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              Rs {t.taxCollected.toLocaleString()}
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
                        report.transactions.length
                      )}{" "}
                      of {report.transactions.length}
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

            {report.transactions.length === 0 && (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <IconReceipt2
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <p className="text-gray-500 font-medium">
                  No transactions found for this period
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxReportPage;

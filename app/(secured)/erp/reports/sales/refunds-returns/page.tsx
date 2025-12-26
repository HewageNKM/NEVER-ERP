"use client";

import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import * as XLSX from "xlsx";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";

const RefundsReturnsReport = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fetchReport = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/v2/reports/sales/refunds-returns", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    if (!report?.items?.length) return;

    const formatted = report.items.map((o: any) => ({
      "Order ID": o.orderId,
      Status: o.status,
      "Refund Amount (Rs)": o.refundAmount,
      Restocked: o.restocked ? "Yes" : "No",
      "Restocked At": o.restockedAt || "-",
      "Created At": o.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refunds & Returns");
    XLSX.writeFile(wb, "refunds_returns.xlsx");
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
    <PageContainer title="Refunds & Returns">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Refunds & Returns
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Summary of refunded and returned orders.
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
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-sm focus:outline-none focus:border-gray-900 w-full sm:w-auto"
                />
                <span className="text-gray-400 font-medium">-</span>
                <input
                  type="date"
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
                Apply
              </button>
            </form>

            <button
              onClick={exportExcel}
              disabled={!report?.items?.length}
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Total Returned Orders"
                value={report.totalOrders}
              />
              <SummaryCard
                title="Total Refunded Amount"
                value={`Rs ${report.totalRefundAmount}`}
              />
              <SummaryCard
                title="Total Restocked Items"
                value={report.totalRestockedItems}
              />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider text-right">
                        Refund Amount
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Restocked
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Restocked At
                      </th>
                      <th className="px-6 py-3 font-bold tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.items?.length > 0 ? (
                      report.items.map((o: any, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {o.orderId}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-bold uppercase rounded-sm ${
                                o.status === "Refunded"
                                  ? "bg-red-50 text-red-700"
                                  : o.status === "Returned"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-red-600">
                            Rs {o.refundAmount}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {o.restocked ? "Yes" : "No"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {o.restockedAt || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {o.createdAt}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No records found
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

export default RefundsReturnsReport;

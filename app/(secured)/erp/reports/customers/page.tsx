"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  IconFilter,
  IconDownload,
  IconUsers,
  IconUserPlus,
  IconRepeat,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface CustomerAnalytics {
  period: { from: string; to: string };
  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    ordersPerCustomer: number;
  };
  topCustomers: {
    name: string;
    email?: string;
    phone?: string;
    totalOrders: number;
    totalSpent: number;
  }[];
  acquisitionBySource: { source: string; count: number; percentage: number }[];
}

const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

const CustomerAnalyticsPage = () => {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CustomerAnalytics | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<CustomerAnalytics>(
        "/api/v2/reports/customers",
        {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch customer analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchReport();
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report) {
      showNotification("No data to export", "info");
      return;
    }

    const overviewData = [
      { Metric: "Total Customers", Value: report.overview.totalCustomers },
      { Metric: "New Customers", Value: report.overview.newCustomers },
      {
        Metric: "Returning Customers",
        Value: report.overview.returningCustomers,
      },
      {
        Metric: "Average Order Value",
        Value: report.overview.averageOrderValue,
      },
      {
        Metric: "Orders Per Customer",
        Value: report.overview.ordersPerCustomer,
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, "Overview");

    const ws2 = XLSX.utils.json_to_sheet(
      report.topCustomers.map((c) => ({
        Name: c.name,
        Email: c.email || "",
        Phone: c.phone || "",
        Orders: c.totalOrders,
        "Total Spent": c.totalSpent,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws2, "Top Customers");

    XLSX.writeFile(wb, `customer_analytics_${from}_${to}.xlsx`);
    showNotification("Excel exported successfully", "success");
  };

  return (
    <PageContainer title="Customer Analytics">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Customer Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Customer acquisition, retention, and spending insights.
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
              disabled={!report}
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconUsers size={16} className="text-gray-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Total Customers
                  </p>
                </div>
                <p className="text-2xl font-black text-gray-900">
                  {report.overview.totalCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconUserPlus size={16} className="text-green-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    New Customers
                  </p>
                </div>
                <p className="text-2xl font-black text-green-600">
                  {report.overview.newCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconRepeat size={16} className="text-blue-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Returning
                  </p>
                </div>
                <p className="text-2xl font-black text-blue-600">
                  {report.overview.returningCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Avg Order Value
                </p>
                <p className="text-2xl font-black text-gray-900">
                  Rs {report.overview.averageOrderValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-black p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Orders/Customer
                </p>
                <p className="text-2xl font-black text-white">
                  {report.overview.ordersPerCustomer}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New vs Returning */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
                  New vs Returning Customers
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "New",
                            value: report.overview.newCustomers,
                          },
                          {
                            name: "Returning",
                            value: report.overview.returningCustomers,
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#3B82F6" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Acquisition by Source */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
                  Orders by Source
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.acquisitionBySource}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="source" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#111827" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Customers Table */}
            {report.topCustomers.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Top 10 Customers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Orders
                        </th>
                        <th className="px-6 py-3 font-bold tracking-wider text-right">
                          Total Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.topCustomers.map((customer, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {customer.email || customer.phone || "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {customer.totalOrders}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            Rs {customer.totalSpent.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CustomerAnalyticsPage;

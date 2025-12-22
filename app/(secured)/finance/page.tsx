"use client";
import React, { useEffect, useState } from "react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconReceipt,
  IconBuildingBank,
  IconLoader2,
  IconTrendingUp,
} from "@tabler/icons-react";
// The project seems to use Tailwind mostly. I will stick to Tailwind.
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import type { FinanceDashboardData } from "@/services/FinanceDashboardService";

// Card Component
const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 border border-gray-200 relative overflow-hidden group hover:border-black transition-colors duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-black tracking-tight">
          {value}
        </h3>
      </div>
      <div className="p-2 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-colors duration-300">
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      {trend && (
        <span
          className={`flex items-center text-xs font-bold ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <IconArrowUpRight size={14} className="mr-1" />
          ) : (
            <IconArrowDownRight size={14} className="mr-1" />
          )}
        </span>
      )}
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
        {subtext}
      </p>
    </div>
  </div>
);

const FinanceDashboard = () => {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await axios.get("/api/v2/finance/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Finance Dashboard">
        <div className="flex justify-center items-center h-[60vh]">
          <IconLoader2 size={40} className="animate-spin text-gray-300" />
        </div>
      </PageContainer>
    );
  }

  if (!data)
    return (
      <PageContainer title="Finance Dashboard">
        <div>Error loading data</div>
      </PageContainer>
    );

  const {
    cards = {
      totalBankBalance: 0,
      totalPayable: 0,
      monthlyExpenses: 0,
      monthlyIncome: 0,
    },
    expenseBreakdown = [],
    recentTransactions = [],
    cashFlow = [],
  } = data;

  // Chart Configs
  const cashFlowOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#000000", "#E5E7EB"],
    plotOptions: {
      bar: { borderRadius: 2, columnWidth: "50%" },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cashFlow.map((c: any) => c.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: true, position: "top", horizontalAlign: "right" },
  };

  const cashFlowSeries = [
    { name: "Income", data: cashFlow.map((c: any) => c.income) },
    { name: "Expense", data: cashFlow.map((c: any) => c.expense) },
  ];

  const pieOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: expenseBreakdown.map((e: any) => e.category),
    colors: expenseBreakdown.map((e: any) => e.color),
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "75%" } } },
    stroke: { show: false },
  };

  const pieSeries = expenseBreakdown.map((e: any) => e.amount);

  const formatCurrency = (val: number) => `Rs ${val?.toLocaleString()}`;

  return (
    <PageContainer title="Finance Overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
              Financial Overview
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Real-time financial insights
            </p>
          </div>
          <button className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 flex items-center gap-2">
            <IconTrendingUp size={16} /> Generate Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Bank Balance"
            value={formatCurrency(cards.totalBankBalance)}
            subtext="Across all accounts"
            icon={IconBuildingBank}
            trend="up"
          />
          <StatCard
            title="Accounts Payable"
            value={formatCurrency(cards.totalPayable)}
            subtext="Total Outstanding"
            icon={IconReceipt}
            trend="down"
          />
          <StatCard
            title="Monthly Expenses"
            value={formatCurrency(cards.monthlyExpenses)}
            subtext="This Month"
            icon={IconWallet}
            trend="down"
          />
          <StatCard
            title="Monthly Income"
            value={formatCurrency(cards.monthlyIncome)}
            subtext="This Month"
            icon={IconArrowUpRight}
            trend="up"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow */}
          <div className="lg:col-span-2 bg-white p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Cash Flow
              </h3>
              <select className="bg-gray-50 border-none text-xs font-bold uppercase outline-none cursor-pointer">
                <option>This Month</option>
              </select>
            </div>
            <Chart
              options={cashFlowOptions as any}
              series={cashFlowSeries}
              type="bar"
              height={300}
            />
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white p-6 border border-gray-200">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">
              Expense Breakdown
            </h3>
            <div className="relative h-[200px] mb-6 flex items-center justify-center">
              <Chart
                options={pieOptions as any}
                series={pieSeries}
                type="donut"
                height={220}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="block text-2xl font-black text-black">
                    {(
                      (expenseBreakdown.reduce(
                        (acc: any, curr: any) => acc + curr.amount,
                        0
                      ) /
                        cards.monthlyExpenses) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {expenseBreakdown.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: item.color }}
                    ></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-xs font-bold">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest">
              Recent Transactions
            </h3>
            <a
              href="/finance/petty-cash"
              className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-black"
            >
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full ${
                            tx.type === "income"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <IconArrowUpRight size={14} />
                          ) : (
                            <IconArrowDownRight size={14} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-900">
                            {tx.category}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {tx.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {tx.note}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-black ${
                          tx.type === "income" ? "text-green-600" : "text-black"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}{" "}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default FinanceDashboard;

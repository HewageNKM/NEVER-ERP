"use client";
import React from "react";
import Link from "next/link";
import PageContainer from "../components/container/PageContainer";
import {
  IconChartBar,
  IconArrowRight,
  IconPackage,
  IconCoin,
  IconReceipt,
} from "@tabler/icons-react";

const Reports = () => {
  const reportSections = [
    {
      id: "01",
      category: "Financial",
      icon: <IconCoin size={20} stroke={2} />,
      reports: [
        { title: "P&L Statement", link: "/erp/reports/pnl" },
        { title: "Tax Report", link: "/erp/reports/tax" },
        { title: "Cashflow Statement", link: "/erp/reports/cash/cashflow" },
      ],
    },
    {
      id: "02",
      category: "Sales Analysis",
      icon: <IconChartBar size={20} stroke={2} />,
      reports: [
        { title: "Daily Summary", link: "/erp/reports/sales/daily-summary" },
        {
          title: "Monthly Summary",
          link: "/erp/reports/sales/monthly-summary",
        },
        { title: "Yearly Summary", link: "/erp/reports/sales/yearly-summary" },
        {
          title: "Top Selling Products",
          link: "/erp/reports/sales/top-products",
        },
        { title: "Sales by Category", link: "/erp/reports/sales/by-category" },
        { title: "Sales by Brand", link: "/erp/reports/sales/by-brand" },
        {
          title: "Sales vs Discount",
          link: "/erp/reports/sales/sales-vs-discount",
        },
        {
          title: "By Payment Method",
          link: "/erp/reports/sales/by-payment-method",
        },
        {
          title: "Refunds & Returns",
          link: "/erp/reports/sales/refunds-returns",
        },
      ],
    },
    {
      id: "03",
      category: "Revenue",
      icon: <IconCoin size={20} stroke={2} />,
      reports: [
        { title: "Daily Revenue", link: "/erp/reports/revenues/daily-revenue" },
        {
          title: "Monthly Revenue",
          link: "/erp/reports/revenues/monthly-revenue",
        },
        {
          title: "Yearly Revenue",
          link: "/erp/reports/revenues/yearly-revenue",
        },
      ],
    },
    {
      id: "04",
      category: "Expenses",
      icon: <IconReceipt size={20} stroke={2} />,
      reports: [{ title: "Expense Report", link: "/erp/reports/expenses" }],
    },
    {
      id: "05",
      category: "Inventory",
      icon: <IconPackage size={20} stroke={2} />,
      reports: [
        { title: "Live Stock", link: "/erp/reports/stocks/live-stock" },
        { title: "Low Stock Alerts", link: "/erp/reports/stocks/low-stock" },
        { title: "Stock Valuation", link: "/erp/reports/stocks/valuation" },
      ],
    },
    {
      id: "06",
      category: "Customer Insights",
      icon: <IconChartBar size={20} stroke={2} />,
      reports: [
        { title: "Customer Analytics", link: "/erp/reports/customers" },
      ],
    },
  ];

  return (
    <PageContainer title="Reports">
      <div className="w-full space-y-12">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b-4 border-black pb-8">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-black"></div> Data Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black leading-none">
            Reports Center
          </h1>
        </div>

        <div className="space-y-16">
          {reportSections.map((section) => (
            <div key={section.id} className="relative">
              {/* Section Header */}
              <div className="flex items-end gap-4 mb-6 border-b border-gray-200 pb-4">
                <span className="text-4xl font-black text-gray-200 leading-none">
                  {section.id}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2 mb-1">
                  {section.category}
                </h3>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.reports.map((report, index) => (
                  <Link
                    key={index}
                    href={report.link}
                    className="group flex flex-col justify-between p-6 h-[140px] bg-white border border-gray-200 hover:border-black hover:bg-black transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Background Icon Decoration */}
                    <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500">
                      {section.icon}
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="w-8 h-1 bg-black group-hover:bg-white transition-colors"></div>
                      <IconArrowRight
                        size={20}
                        className="text-black group-hover:text-white -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <span className="text-sm font-black uppercase tracking-wide text-black group-hover:text-white transition-colors block max-w-[80%] leading-tight">
                        {report.title}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-500 mt-2 block">
                        View Report
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;

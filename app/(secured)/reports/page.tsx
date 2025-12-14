"use client";
import React from "react";
import Link from "next/link";
import PageContainer from "../components/container/PageContainer";
import { IconChartBar, IconChevronRight } from "@tabler/icons-react";

const Reports = () => {
  const reportSections = [
    {
      category: "Sales Reports",
      reports: [
        {
          title: "Daily Summary",
          link: "/reports/sales/daily-summary",
        },
        {
          title: "Monthly Summary",
          link: "/reports/sales/monthly-summary",
        },
        {
          title: "Yearly Summary",
          link: "/reports/sales/yearly-summary",
        },
        {
          title: "Top Selling Products",
          link: "/reports/sales/top-products",
        },
        {
          title: "Sales by Category",
          link: "/reports/sales/by-category",
        },
        { title: "Sales by Brand", link: "/reports/sales/by-brand" },
        {
          title: "Sales vs Discount",
          link: "/reports/sales/sales-vs-discount",
        },
        {
          title: "Sales by Payment Method",
          link: "/reports/sales/by-payment-method",
        },
        {
          title: "Refunds & Returns",
          link: "/reports/sales/refunds-returns",
        },
      ],
    },
    {
      category: "Stock Reports",
      reports: [
        { title: "Live Stock", link: "/reports/stocks/live-stock" },
        {
          title: "Low Stock",
          link: "/reports/stocks/low-stock",
        },
        {
          title: "Stock Valuation",
          link: "/reports/stocks/valuation",
        },
      ],
    },
    {
      category: "Revenue Reports",
      reports: [
        {
          title: "Daily Revenue",
          link: "/reports/revenues/daily-revenue",
        },
        {
          title: "Monthly Revenue",
          link: "/reports/revenues/monthly-revenue",
        },
        {
          title: "Yearly Revenue",
          link: "/reports/revenues/yearly-revenue",
        },
      ],
    },
    {
      category: "Cash Reports",
      reports: [
        {
          title: "Cashflow",
          link: "/reports/cash/cashflow",
        },
      ],
    },
  ];

  return (
    <PageContainer title="Reports">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <IconChartBar className="text-gray-900" size={28} />
            Reports Center
          </h2>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold">
            Analytics and Performance Metrics
          </p>
        </div>

        <div className="space-y-10">
          {reportSections.map((section, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="border-b-2 border-gray-900 mb-6 pb-2">
                <h3 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                  {section.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.reports.map((report, index) => (
                  <Link
                    key={index}
                    href={report.link}
                    className="group flex items-center p-4 bg-gray-50 border border-gray-200 rounded-sm hover:bg-gray-900 hover:border-gray-900 hover:text-white transition-all duration-200"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-bold uppercase tracking-wide group-hover:text-white text-gray-700">
                        {report.title}
                      </span>
                    </div>
                    <IconChevronRight
                      size={18}
                      className="text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-transform"
                    />
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

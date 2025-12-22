"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ProfitLossStatement {
  period: { from: string; to: string };
  revenue: {
    grossSales: number;
    discounts: number;
    netSales: number;
    shippingIncome: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: {
    productCost: number;
    shippingCost: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    byCategory: { category: string; amount: number }[];
    totalExpenses: number;
  };
  operatingIncome: number;
  otherExpenses: {
    transactionFees: number;
    otherFees: number;
    totalOther: number;
  };
  netProfit: number;
  netProfitMargin: number;
}

const ProfitLossPage = () => {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProfitLossStatement | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<ProfitLossStatement>("/api/v2/reports/pnl", {
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch P&L statement", "error");
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

    const exportData = [
      { Item: "REVENUE", Amount: "" },
      { Item: "Gross Sales", Amount: report.revenue.grossSales },
      { Item: "Less: Discounts", Amount: -report.revenue.discounts },
      { Item: "Net Sales", Amount: report.revenue.netSales },
      { Item: "Shipping Income", Amount: report.revenue.shippingIncome },
      { Item: "Total Revenue", Amount: report.revenue.totalRevenue },
      { Item: "", Amount: "" },
      { Item: "COST OF GOODS SOLD", Amount: "" },
      { Item: "Product Cost", Amount: report.costOfGoodsSold.productCost },
      { Item: "Total COGS", Amount: report.costOfGoodsSold.totalCOGS },
      { Item: "", Amount: "" },
      { Item: "GROSS PROFIT", Amount: report.grossProfit },
      { Item: `Gross Margin (${report.grossProfitMargin}%)`, Amount: "" },
      { Item: "", Amount: "" },
      { Item: "OPERATING EXPENSES", Amount: "" },
      ...report.operatingExpenses.byCategory.map((e) => ({
        Item: e.category,
        Amount: e.amount,
      })),
      {
        Item: "Total Operating Expenses",
        Amount: report.operatingExpenses.totalExpenses,
      },
      { Item: "", Amount: "" },
      { Item: "OPERATING INCOME", Amount: report.operatingIncome },
      { Item: "", Amount: "" },
      { Item: "OTHER EXPENSES", Amount: "" },
      {
        Item: "Transaction Fees",
        Amount: report.otherExpenses.transactionFees,
      },
      { Item: "Total Other Expenses", Amount: report.otherExpenses.totalOther },
      { Item: "", Amount: "" },
      { Item: "NET PROFIT", Amount: report.netProfit },
      { Item: `Net Margin (${report.netProfitMargin}%)`, Amount: "" },
    ];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P&L Statement");
    XLSX.writeFile(wb, `pnl_statement_${from}_${to}.xlsx`);
    showNotification("Excel exported successfully", "success");
  };

  const LineItem = ({
    label,
    value,
    formula,
    bold = false,
    indent = false,
    negative = false,
    highlight = false,
  }: {
    label: string;
    value?: number;
    formula?: string;
    bold?: boolean;
    indent?: boolean;
    negative?: boolean;
    highlight?: boolean;
  }) => (
    <div
      className={`flex justify-between py-2 px-4 ${
        highlight ? "bg-gray-100 border-t border-b border-gray-200" : ""
      } ${indent ? "pl-8" : ""}`}
    >
      <div className="flex flex-col">
        <span className={`${bold ? "font-bold" : ""} text-gray-900`}>
          {label}
        </span>
        {formula && (
          <span className="text-[10px] text-gray-400 font-mono">{formula}</span>
        )}
      </div>
      {value !== undefined && (
        <span
          className={`${bold ? "font-bold" : ""} ${
            value < 0
              ? "text-red-600"
              : negative
              ? "text-red-600"
              : "text-gray-900"
          }`}
        >
          {negative ? "-" : ""}Rs {Math.abs(value).toLocaleString()}
        </span>
      )}
    </div>
  );

  return (
    <PageContainer title="Profit & Loss Statement">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
              Profit & Loss Statement
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Financial performance summary for the selected period.
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
            {/* P&L Statement */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Statement Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Period: {report.period.from} to {report.period.to}
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Net Sale Section */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Net Sale
                  </span>
                </div>
                <LineItem
                  label="Gross Sales"
                  formula="= order.total - shippingFee - fee + discount"
                  value={report.revenue.grossSales}
                  indent
                />
                <LineItem
                  label="Less: Discounts"
                  value={report.revenue.discounts}
                  indent
                  negative
                />
                <LineItem
                  label="Net Sales"
                  formula="= order.total - shippingFee - fee"
                  value={report.revenue.netSales}
                  indent
                  bold
                />
                <LineItem
                  label="Order Fees"
                  formula="= Σ order.fee"
                  value={report.revenue.otherIncome}
                  indent
                />
                <LineItem
                  label="Total Revenue"
                  formula="= Net Sales"
                  value={report.revenue.totalRevenue}
                  bold
                  highlight
                />

                {/* COGS Section */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Cost of Goods Sold
                  </span>
                </div>
                <LineItem
                  label="Product Cost"
                  formula="= Σ (item.bPrice × quantity)"
                  value={report.costOfGoodsSold.productCost}
                  indent
                />
                <LineItem
                  label="Total COGS"
                  value={report.costOfGoodsSold.totalCOGS}
                  bold
                  highlight
                />

                {/* Gross Profit */}
                <LineItem
                  label={`Gross Profit (${report.grossProfitMargin}% margin)`}
                  formula="= Total Revenue - Total COGS"
                  value={report.grossProfit}
                  bold
                  highlight
                />

                {/* Operating Expenses */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Operating Expenses
                  </span>
                </div>
                {report.operatingExpenses.byCategory.map((exp) => (
                  <LineItem
                    key={exp.category}
                    label={exp.category}
                    value={exp.amount}
                    indent
                  />
                ))}
                <LineItem
                  label="Total Operating Expenses"
                  value={report.operatingExpenses.totalExpenses}
                  bold
                  highlight
                />

                {/* Operating Income */}
                <LineItem
                  label="Operating Income"
                  formula="= Gross Profit - Operating Expenses"
                  value={report.operatingIncome}
                  bold
                  highlight
                />

                {/* Other Expenses */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Other Expenses
                  </span>
                </div>
                <LineItem
                  label="Transaction Fees"
                  formula="= Σ order.transactionFeeCharge"
                  value={report.otherExpenses.transactionFees}
                  indent
                />
                <LineItem
                  label="Total Other Expenses"
                  value={report.otherExpenses.totalOther}
                  bold
                />

                {/* Net Profit */}
                <div className="bg-black text-white px-4 py-4 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      Net Profit ({report.netProfitMargin}% margin)
                    </span>
                    <span
                      className={`font-black text-lg ${
                        report.netProfit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Rs {report.netProfit.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    = Operating Income - Transaction Fees + Order Fees
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ProfitLossPage;

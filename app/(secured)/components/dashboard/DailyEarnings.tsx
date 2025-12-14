"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getDailyOverviewAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconCurrencyDollar } from "@tabler/icons-react";

const DailyEarnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchDailyEarnings();
  }, [currentUser]);

  const fetchDailyEarnings = async () => {
    try {
      const overview = await getDailyOverviewAction();
      setTotalEarnings(overview.totalEarnings);
      setTotalProfit(overview.totalProfit);
      setInvoiceCount(overview.totalOrders);
      setTotalDiscount(overview.totalDiscount);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const DetailBlock = ({
    label,
    value,
    isSecondary = false,
  }: {
    label: string;
    value: number;
    isSecondary?: boolean;
  }) => (
    <div
      className={`flex-1 p-3 border ${
        isSecondary ? "border-gray-200 bg-gray-50" : "border-black bg-white"
      }`}
    >
      <span
        className={`block text-[9px] font-bold uppercase tracking-widest ${
          isSecondary ? "text-gray-500" : "text-black"
        }`}
      >
        {label}
      </span>
      <div className="flex items-baseline mt-0.5">
        <span
          className={`text-[10px] font-bold mr-1 ${
            isSecondary ? "text-gray-400" : "text-black"
          }`}
        >
          LKR
        </span>
        <span
          className={`text-lg font-black tracking-tight ${
            isSecondary ? "text-gray-900" : "text-black"
          }`}
        >
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-black uppercase tracking-tighter text-black">
          Daily Snapshot
        </h4>
        <span className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">
          {invoiceCount} Orders
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[120px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Top Row: Gross & Discount */}
          <div className="flex gap-3">
            <DetailBlock
              label="Gross Sales"
              value={totalEarnings}
              isSecondary
            />
            <DetailBlock
              label="Total Discount"
              value={totalDiscount}
              isSecondary
            />
          </div>

          {/* Bottom Row: Net Profit (Hero) - Reduced Padding */}
          <div className="p-4 border-2 border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(229,231,235,1)]">
            <div className="flex items-center gap-2 mb-1">
              <IconCurrencyDollar size={16} className="text-white" />
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                Net Profit (Real Cash)
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="text-sm font-bold mr-1 text-gray-400">LKR</span>
              <span className="text-3xl lg:text-4xl font-black tracking-tighter leading-none">
                {totalProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

export const dynamic = "force-dynamic";
export default DailyEarnings;

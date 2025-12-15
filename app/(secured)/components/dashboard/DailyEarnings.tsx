"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getDailyOverviewAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconCurrencyDollar, IconRefresh } from "@tabler/icons-react";

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
    setLoading(true);
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

  // Calculate Net Sales on the fly
  const grossSale = totalEarnings + totalDiscount;

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
      className={`flex flex-col justify-between p-3 border h-full min-w-0 ${
        isSecondary ? "border-gray-200 bg-gray-50" : "border-black bg-white"
      }`}
    >
      <span
        className={`block text-[9px] font-bold uppercase tracking-widest mb-1 truncate ${
          isSecondary ? "text-gray-500" : "text-black"
        }`}
      >
        {label}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-baseline mt-auto">
        <span
          className={`text-[10px] font-bold mr-1 ${
            isSecondary ? "text-gray-400" : "text-black"
          }`}
        >
          LKR
        </span>
        <span
          className={`text-base sm:text-lg font-black tracking-tight leading-none break-all ${
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
      {/* Header with Title, Refresh, and Order Count */}
      <div className="flex justify-between items-center mb-4 min-w-0 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <h4 className="text-lg font-black uppercase tracking-tighter text-black md:truncate">
            Daily Snapshot
          </h4>
          <button
            onClick={fetchDailyEarnings}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors group"
            title="Refresh Data"
          >
            <IconRefresh
              size={16}
              className={`text-black ${
                loading
                  ? "animate-spin"
                  : "group-hover:rotate-180 transition-transform duration-500"
              }`}
            />
          </button>
        </div>

        <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5 whitespace-nowrap">
          {invoiceCount} Orders
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 min-w-0">
          {/* Row 1: Gross & Discount */}
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <DetailBlock label="Gross Sales" value={grossSale} isSecondary />
            <DetailBlock
              label="Total Discounts"
              value={totalDiscount}
              isSecondary
            />
          </div>

          {/* Row 2: Net Sales (Highlighted) */}
          <DetailBlock label="Net Sales (Revenue)" value={grossSale} />

          {/* Row 3: Net Profit (Hero) */}
          <div className="p-4 border-2 border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(229,231,235,1)] min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <IconCurrencyDollar size={16} className="text-white shrink-0" />
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 truncate">
                Net Profit (Real Cash)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline w-full">
              <span className="text-sm font-bold mr-1 text-gray-400 shrink-0">
                LKR
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-none break-all">
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

export default DailyEarnings;

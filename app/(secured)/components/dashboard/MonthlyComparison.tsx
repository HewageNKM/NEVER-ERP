"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getMonthlyComparisonAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconArrowRight,
} from "@tabler/icons-react";

interface MonthlyData {
  currentMonth: { orders: number; revenue: number; profit: number };
  lastMonth: { orders: number; revenue: number; profit: number };
  percentageChange: { orders: number; revenue: number; profit: number };
}

const MonthlyComparison = () => {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getMonthlyComparisonAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const MetricRow = ({
    label,
    current,
    change,
    isCurrency = false,
  }: {
    label: string;
    current: number;
    change: number;
    isCurrency?: boolean;
  }) => {
    const isPositive = change >= 0;
    return (
      <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
            {label}
          </span>
          <div className="flex items-baseline mt-1">
            {isCurrency && (
              <span className="text-[10px] font-bold text-gray-400 mr-1">
                LKR
              </span>
            )}
            <span className="text-lg font-black text-black">
              {current.toLocaleString()}
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 ${
            isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isPositive ? (
            <IconTrendingUp size={14} />
          ) : (
            <IconTrendingDown size={14} />
          )}
          <span className="text-sm font-black">{Math.abs(change)}%</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Monthly
          </h4>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors group"
            title="Refresh"
          >
            <IconRefresh
              size={14}
              className={`text-black ${
                loading
                  ? "animate-spin"
                  : "group-hover:rotate-180 transition-transform duration-500"
              }`}
            />
          </button>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
          vs Last <IconArrowRight size={10} />
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[180px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-2">
          <MetricRow
            label="Orders"
            current={data.currentMonth.orders}
            change={data.percentageChange.orders}
          />
          <MetricRow
            label="Net Sale"
            current={data.currentMonth.revenue}
            change={data.percentageChange.revenue}
            isCurrency
          />
          <MetricRow
            label="Profit"
            current={data.currentMonth.profit}
            change={data.percentageChange.profit}
            isCurrency
          />
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">No data available</div>
      )}
    </DashboardCard>
  );
};

export default MonthlyComparison;

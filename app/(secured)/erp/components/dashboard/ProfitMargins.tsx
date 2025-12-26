"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getProfitMarginsAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconPercentage, IconRefresh, IconCoin } from "@tabler/icons-react";

interface MarginData {
  grossMargin: number;
  netMargin: number;
  avgOrderValue: number;
}

const ProfitMargins = () => {
  const [data, setData] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getProfitMarginsAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const MarginBar = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
          {label}
        </span>
        <span className="text-sm font-black text-black">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 w-full">
        <div
          className={`h-2 ${color} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconPercentage size={18} className="text-blue-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Profit Margins
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
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5">
          This Month
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[140px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data ? (
        <div>
          <MarginBar
            label="Gross Margin"
            value={data.grossMargin}
            color="bg-gray-400"
          />
          <MarginBar
            label="Net Margin"
            value={data.netMargin}
            color="bg-black"
          />

          <div className="mt-4 p-3 border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCoin size={14} className="text-gray-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  Avg. Order Value
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-[10px] font-bold text-gray-400 mr-1">
                  LKR
                </span>
                <span className="text-lg font-black text-black">
                  {data.avgOrderValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">No data available</div>
      )}
    </DashboardCard>
  );
};

export default ProfitMargins;

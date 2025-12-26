"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getRevenueByCategoryAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconRefresh, IconCategory2 } from "@tabler/icons-react";

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

const RevenueByCategory = () => {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getRevenueByCategoryAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    "bg-black",
    "bg-gray-700",
    "bg-gray-500",
    "bg-gray-400",
    "bg-gray-300",
    "bg-gray-200",
  ];

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconCategory2 size={18} className="text-teal-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Revenue by Category
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
        <div className="flex justify-center items-center h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-3">
          {/* Stacked bar */}
          <div className="flex h-3 w-full overflow-hidden">
            {data.map((cat, idx) => (
              <div
                key={cat.category}
                className={`${
                  colors[idx] || "bg-gray-200"
                } transition-all duration-500`}
                style={{ width: `${cat.percentage}%` }}
                title={`${cat.category}: ${cat.percentage}%`}
              ></div>
            ))}
          </div>

          {/* Category list */}
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {data.map((cat, idx) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-2 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-3 h-3 ${
                      colors[idx] || "bg-gray-200"
                    } shrink-0`}
                  ></div>
                  <span className="text-xs font-bold text-black truncate">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {cat.orders} orders
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-black">
                    LKR {cat.revenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
          <IconCategory2 size={32} className="mb-2 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-widest">
            No sales data this month
          </p>
        </div>
      )}
    </DashboardCard>
  );
};

export default RevenueByCategory;

"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getExpenseSummaryAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconReceipt, IconRefresh, IconCategory } from "@tabler/icons-react";

interface ExpenseData {
  todayExpenses: number;
  monthExpenses: number;
  topCategory: string;
  topCategoryAmount: number;
}

const ExpenseSummary = () => {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getExpenseSummaryAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconReceipt size={18} className="text-red-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Expenses
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
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[140px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-gray-200 bg-gray-50">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                Today
              </span>
              <div className="flex items-baseline">
                <span className="text-[10px] font-bold text-gray-400 mr-1">
                  LKR
                </span>
                <span className="text-lg font-black text-black">
                  {data.todayExpenses.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-3 border border-black bg-white">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                This Month
              </span>
              <div className="flex items-baseline">
                <span className="text-[10px] font-bold text-gray-400 mr-1">
                  LKR
                </span>
                <span className="text-lg font-black text-black">
                  {data.monthExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCategory size={14} className="text-gray-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  Top Category
                </span>
              </div>
              <span className="text-xs font-black text-black">
                {data.topCategory}
              </span>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-gray-500">
                LKR {data.topCategoryAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">No data available</div>
      )}
    </DashboardCard>
  );
};

export default ExpenseSummary;

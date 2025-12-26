"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getInventoryValueAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconPackage, IconRefresh } from "@tabler/icons-react";

interface InventoryData {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  avgItemValue: number;
}

const InventoryValue = () => {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getInventoryValueAction();
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
          <IconPackage size={18} className="text-indigo-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Inventory Value
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
        <div className="flex justify-center items-center h-[160px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-3">
          <div className="p-4 border-2 border-black bg-black text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
              Total Stock Value
            </span>
            <div className="flex items-baseline">
              <span className="text-sm font-bold text-gray-400 mr-1">LKR</span>
              <span className="text-2xl font-black">
                {data.totalValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 border border-gray-200 bg-gray-50 text-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 block">
                Products
              </span>
              <span className="text-lg font-black text-black">
                {data.totalProducts}
              </span>
            </div>
            <div className="p-2 border border-gray-200 bg-gray-50 text-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 block">
                Qty
              </span>
              <span className="text-lg font-black text-black">
                {data.totalQuantity.toLocaleString()}
              </span>
            </div>
            <div className="p-2 border border-gray-200 bg-gray-50 text-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 block">
                Avg/Item
              </span>
              <span className="text-lg font-black text-black">
                {data.avgItemValue.toLocaleString()}
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

export default InventoryValue;

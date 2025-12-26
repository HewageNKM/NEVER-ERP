"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getLowStockAlertsAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface LowStockItem {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  currentStock: number;
  thumbnail?: string;
}

const LowStockAlerts = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchLowStock();
  }, [currentUser]);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const data = await getLowStockAlertsAction(5, 8);
      setItems(data);
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
          <IconAlertTriangle size={18} className="text-orange-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Low Stock Alerts
          </h4>
          <button
            onClick={fetchLowStock}
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
        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5">
          {items.length} Items
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[160px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[160px] text-gray-400">
          <IconAlertTriangle size={32} className="mb-2 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-widest">
            No low stock items
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 border border-gray-100 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.productName}
                    className="w-8 h-8 object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 flex items-center justify-center">
                    <IconAlertTriangle size={14} className="text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-black truncate">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {item.variantName} • Size {item.size}
                  </p>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <span
                  className={`text-sm font-black ${
                    item.currentStock <= 2 ? "text-red-600" : "text-orange-600"
                  }`}
                >
                  {item.currentStock}
                </span>
                <span className="text-[9px] text-gray-400 ml-1">left</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};

export default LowStockAlerts;

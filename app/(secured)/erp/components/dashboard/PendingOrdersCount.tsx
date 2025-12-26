"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPendingOrdersCountAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import {
  IconClock,
  IconTruck,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";

interface PendingData {
  pendingPayment: number;
  pendingShipment: number;
  total: number;
}

const PendingOrdersCount = () => {
  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPendingOrdersCountAction();
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
          <IconAlertCircle size={18} className="text-red-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Needs Attention
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
        <div className="flex justify-center items-center h-[100px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-4 border-2 border-black bg-black text-white">
            <div className="flex items-center gap-3">
              <IconAlertCircle size={24} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Total Pending
                </p>
                <p className="text-2xl font-black">{data.total}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <IconClock size={14} className="text-yellow-600" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-700">
                  Awaiting Payment
                </span>
              </div>
              <p className="text-xl font-black text-yellow-700">
                {data.pendingPayment}
              </p>
            </div>

            <div className="p-3 border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <IconTruck size={14} className="text-blue-600" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-700">
                  To Ship
                </span>
              </div>
              <p className="text-xl font-black text-blue-700">
                {data.pendingShipment}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">No data available</div>
      )}
    </DashboardCard>
  );
};

export default PendingOrdersCount;

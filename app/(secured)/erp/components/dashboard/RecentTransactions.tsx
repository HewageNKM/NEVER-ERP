"use client";

import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import { showNotification } from "@/utils/toast";
import { IconReceipt, IconRefresh } from "@tabler/icons-react";
import { getRecentOrdersAction } from "@/actions/reportsActions";
import { useAppSelector } from "@/lib/hooks";

interface RecentOrder {
  orderId: string;
  paymentStatus: string;
  customerName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  createdAt: string;
}

const RecentTransactions = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchRecentOrders();
    }
  }, [currentUser]);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const data = await getRecentOrdersAction(6);
      setOrders(data);
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Status styling helper
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Paid":
        return {
          dot: "bg-black border-black",
          badge: "border-black text-white bg-black",
        };
      case "Pending":
        return {
          dot: "bg-white border-black",
          badge: "border-black text-black bg-white",
        };
      case "Failed":
        return {
          dot: "bg-red-600 border-red-600",
          badge: "border-red-600 text-red-600 bg-white",
        };
      case "Refunded":
        return {
          dot: "bg-orange-500 border-orange-500",
          badge: "border-orange-500 text-orange-500 bg-white",
        };
      default:
        return {
          dot: "bg-gray-300 border-gray-300",
          badge: "border-gray-300 text-gray-400 bg-gray-50",
        };
    }
  };

  return (
    <DashboardCard title="Recent Orders">
      <div className="flex justify-end -mt-6 mb-2">
        <button
          onClick={fetchRecentOrders}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors group"
          title="Refresh"
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
      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
          <IconReceipt size={32} className="mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">
            No Recent Orders
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 mt-4 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[7px] top-2 bottom-6 w-[1px] bg-gray-200"></div>

          {orders.map((order) => {
            const styles = getStatusStyles(order.paymentStatus);

            return (
              <div
                key={order.orderId}
                className="flex gap-4 pb-8 last:pb-0 relative group"
              >
                {/* Timeline Dot */}
                <div className="relative z-10 pt-1.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm z-10 ${styles.dot}`}
                  ></div>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {/* Date & Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {order.createdAt}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border ${styles.badge}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  {/* Order ID & Customer */}
                  <h4 className="text-sm font-black uppercase tracking-tight text-black leading-none mt-1">
                    Order #{order.orderId}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mb-2 truncate">
                    {order.customerName}
                  </p>

                  {/* Price Breakdown Container */}
                  <div className="bg-gray-50 p-3 border border-gray-100 relative">
                    {/* Gross Sale */}
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      <span>Gross Sale</span>
                      <span>LKR {order.grossAmount.toFixed(2)}</span>
                    </div>

                    {/* Discount (Only show if exists) */}
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Discount</span>
                        <span className="text-red-500">
                          - LKR {order.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Net / Real Cash Amount */}
                    <div className="flex justify-between items-end border-t border-gray-200 pt-2 mt-1">
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                        Net Total
                      </span>
                      <span className="text-sm font-black text-black tracking-tight leading-none">
                        LKR {order.netAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

export default RecentTransactions;

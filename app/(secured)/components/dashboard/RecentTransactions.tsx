"use client";

import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "@firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { Order } from "@/model";
import { showNotification } from "@/utils/toast";
import { IconReceipt } from "@tabler/icons-react";

const RecentTransactions = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef,
        orderBy("createdAt", "desc"),
        limit(6)
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate().toLocaleString(),
        })) as Order[];
        setOrders(ordersData);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    }
  }, []);

  return (
    <DashboardCard title="Recent Orders">
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

          {orders.map((order: Order) => {
            // --- STATUS COLOR LOGIC ---
            let statusDotClass = "bg-gray-200 border-gray-200"; // Default
            let statusBadgeClass = "border-gray-200 text-gray-400 bg-gray-50"; // Default

            switch (order.paymentStatus) {
              case "Paid":
                // Solid Black = Success/Completed
                statusDotClass = "bg-black border-black";
                statusBadgeClass = "border-black text-white bg-black";
                break;
              case "Pending":
                // Hollow Black = Waiting
                statusDotClass = "bg-white border-black";
                statusBadgeClass = "border-black text-black bg-white";
                break;
              case "Failed":
                // Red = Error/Failure
                statusDotClass = "bg-red-600 border-red-600";
                statusBadgeClass = "border-red-600 text-red-600 bg-white";
                break;
              case "Refunded":
                // Orange/Yellow = Warning/Reversal
                statusDotClass = "bg-orange-500 border-orange-500";
                statusBadgeClass = "border-orange-500 text-orange-500 bg-white";
                break;
              default:
                // Gray = Unknown/Cancelled
                statusDotClass = "bg-gray-300 border-gray-300";
                statusBadgeClass = "border-gray-300 text-gray-400 bg-gray-50";
                break;
            }

            // 1. Calculate Gross (Sum of all items * quantity)
            const grossAmount = order.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            // 2. Get Discount
            const discountAmount = order.discount || 0;

            // 3. Calculate Net (Real Cash Amount)
            const netAmount = grossAmount - discountAmount;

            return (
              <div
                key={order.orderId}
                className="flex gap-4 pb-8 last:pb-0 relative group"
              >
                {/* Timeline Dot */}
                <div className="relative z-10 pt-1.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm z-10 ${statusDotClass}`}
                  ></div>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {/* Date & Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {order.createdAt}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 border ${statusBadgeClass}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  {/* Order ID & Customer */}
                  <h4 className="text-sm font-black uppercase tracking-tight text-black leading-none mt-1">
                    Order #{order.orderId}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mb-2 truncate">
                    {order?.customer?.name || "Guest Customer"}
                  </p>

                  {/* Price Breakdown Container */}
                  <div className="bg-gray-50 p-3 border border-gray-100 relative">
                    {/* Gross Sale */}
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      <span>Gross Sale</span>
                      <span>LKR {grossAmount.toFixed(2)}</span>
                    </div>

                    {/* Discount (Only show if exists) */}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Discount</span>
                        <span className="text-red-500">
                          - LKR {discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Net / Real Cash Amount */}
                    <div className="flex justify-between items-end border-t border-gray-200 pt-2 mt-1">
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                        Net Total
                      </span>
                      <span className="text-sm font-black text-black tracking-tight leading-none">
                        LKR {netAmount.toFixed(2)}
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

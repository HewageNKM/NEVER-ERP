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
import { useSnackbar } from "@/contexts/SnackBarContext";

const RecentTransactions = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useSnackbar();

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
        <p className="text-center py-6 text-sm text-gray-500 font-medium uppercase tracking-wide">
          No recent orders available.
        </p>
      ) : (
        <div className="flex flex-col gap-0 mt-4 relative">
          {/* Vertical Line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gray-200"></div>

          {orders.map((order: Order) => {
            const statusColor =
              order.paymentStatus === "Paid"
                ? "bg-green-500"
                : order.paymentStatus === "Pending"
                ? "bg-yellow-500"
                : "bg-red-500";

            return (
              <div
                key={order.orderId}
                className="flex gap-4 pb-6 last:pb-0 relative group"
              >
                {/* Dot */}
                <div className="relative z-10 pt-1.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${statusColor}`}
                  ></div>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {order.createdAt}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white tracking-widest ${statusColor}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  <h4 className="text-sm font-black uppercase tracking-tight text-black">
                    Order #{order.orderId}
                  </h4>
                  <p className="text-xs font-medium text-gray-600">
                    {order?.customer?.name || "Not Available"}
                  </p>

                  <div className="mt-1 flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <span>Total</span>
                      <span className="text-black font-bold">
                        LKR{" "}
                        {order.items
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <span>Discount</span>
                      <span>LKR {(order?.discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-black uppercase tracking-tighter border-t border-gray-100 pt-1 mt-1">
                      <span>Subtotal</span>
                      <span>
                        LKR{" "}
                        {(
                          order.items.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ) -
                          (order?.discount | 0)
                        ).toFixed(2)}
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

export const dynamic = "force-dynamic";
export default RecentTransactions;

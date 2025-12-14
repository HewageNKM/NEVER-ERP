"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getDailyOverviewAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";

const DailyEarnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  

  useEffect(() => {
    if (currentUser) {
      fetchDailyEarnings();
    }
  }, [currentUser]);

  const fetchDailyEarnings = async () => {
    try {
      const overview = await getDailyOverviewAction();
      setTotalEarnings(overview.totalEarnings);
      setTotalProfit(overview.totalProfit);
      setInvoiceCount(overview.totalOrders);
      setTotalDiscount(overview.totalDiscount);
      setTotalExpense(overview.totalExpense);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardCard title={`Daily Summary (${invoiceCount})`}>
      {loading ? (
        <div className="flex justify-center items-center h-[100px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold uppercase tracking-tight flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm">Sale</span>
              <span>LKR {totalEarnings.toFixed(2)}</span>
            </h4>
            <h4 className="text-xl font-bold uppercase tracking-tight flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm">Discount</span>
              <span>LKR {totalDiscount.toFixed(2)}</span>
            </h4>
            <h4 className="text-3xl font-black uppercase tracking-tighter flex justify-between items-center pt-2">
              <span className="text-black text-lg">Profit</span>
              <span>LKR {totalProfit.toFixed(2)}</span>
            </h4>
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

export const dynamic = "force-dynamic";
export default DailyEarnings;

"use client";
import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getOrderStatusDistributionAction } from "@/actions/reportsActions";
import { showNotification } from "@/utils/toast";
import { IconRefresh, IconChartPie } from "@tabler/icons-react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatusData {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
}

const OrderStatusDistribution = () => {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getOrderStatusDistributionAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const chartOptions: any = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels: [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refunded",
    ],
    colors: ["#fbbf24", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#6b7280"],
    legend: {
      position: "bottom",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: "10px",
      labels: { colors: "#71717a" },
      markers: { width: 8, height: 8, radius: 0 },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "10px",
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#71717a",
            },
            value: {
              show: true,
              fontSize: "20px",
              fontFamily: "inherit",
              fontWeight: 900,
              color: "#000000",
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "10px",
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#71717a",
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val} orders`,
      },
    },
  };

  const series = data
    ? [
        data.pending,
        data.processing,
        data.shipped,
        data.delivered,
        data.cancelled,
        data.refunded,
      ]
    : [];

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconChartPie size={18} className="text-purple-500" />
          <h4 className="text-lg font-black uppercase tracking-tighter text-black">
            Order Status
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
        <div className="flex justify-center items-center h-[220px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : data && series.some((v) => v > 0) ? (
        <Chart
          options={chartOptions}
          series={series}
          type="donut"
          height={220}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
          <IconChartPie size={32} className="mb-2 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-widest">
            No orders this month
          </p>
        </div>
      )}
    </DashboardCard>
  );
};

export default OrderStatusDistribution;

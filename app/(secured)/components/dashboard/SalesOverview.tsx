"use client";

import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/lib/hooks";
import { showNotification } from "@/utils/toast";
import { getYearlySalesAction } from "@/actions/reportsActions";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesOverview = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    website: Array(12).fill(0),
    store: Array(12).fill(0),
  });
  const [months] = useState<string[]>(
    Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("default", { month: "short" }).toUpperCase()
    )
  );

  const { currentUser } = useAppSelector((state) => state.authSlice);

  const primaryColor = "#000000";
  const secondaryColor = "#e5e7eb";

  // REDUCED HEIGHT HERE
  const chartHeight = 300;

  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      height: chartHeight,
      fontFamily: "inherit",
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeinout", speed: 500 },
    },
    colors: [primaryColor, secondaryColor],
    plotOptions: {
      bar: { horizontal: false, columnWidth: "50%", borderRadius: 0 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0, colors: ["transparent"] },
    xaxis: {
      categories: months.length ? months : Array(12).fill("N/A"),
      axisBorder: {
        show: true,
        color: "#000000",
        height: 1,
        width: "100%",
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#71717a",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 800,
          cssClass: "tracking-widest uppercase",
        },
      },
    },
    yaxis: {
      tickAmount: 3, // Reduced ticks for smaller height
      labels: {
        style: {
          colors: "#71717a",
          fontSize: "10px",
          fontFamily: "inherit",
          fontWeight: 700,
        },
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 }, // Tighter padding
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      offsetY: -20, // Move legend up into header space
      fontFamily: "inherit",
      fontWeight: 700,
      labels: { colors: "#000000", useSeriesColors: false },
      markers: { width: 8, height: 8, radius: 0 },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    tooltip: {
      theme: "light",
      style: { fontSize: "12px", fontFamily: "inherit" },
      marker: { show: true },
      x: { show: false },
      fixed: { enabled: false, position: "topRight", offsetX: 0, offsetY: 0 },
      dropShadow: { enabled: false },
    },
  };

  const seriescolumnchart = [
    {
      name: "WEBSITE",
      data:
        salesData.website && salesData.website.length
          ? salesData.website
          : Array(12).fill(0),
    },
    {
      name: "STORE",
      data:
        salesData.store && salesData.store.length
          ? salesData.store
          : Array(12).fill(0),
    },
  ];

  useEffect(() => {
    if (currentUser) {
      fetchSalesData();
    }
  }, [currentUser]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const data = await getYearlySalesAction();
      setSalesData({
        website: data.website,
        store: data.store,
      });
    } catch (error: any) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div>
        <h4 className="text-lg font-black uppercase tracking-tighter text-black">
          Sales Performance
        </h4>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          Year to Date Comparison
        </p>
      </div>
      {loading ? (
        <div
          className={`flex justify-center items-center h-[${chartHeight}px]`}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <Chart
          options={optionscolumnchart}
          series={seriescolumnchart}
          type="bar"
          height={chartHeight}
          width={"100%"}
        />
      )}
    </DashboardCard>
  );
};

export default SalesOverview;

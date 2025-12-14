import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import dynamic from "next/dynamic";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "@firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { showNotification } from "@/utils/toast";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesOverview = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    website: Array(12).fill(0),
    store: Array(12).fill(0),
  });
  const [months, setMonths] = useState<string[]>(
    Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("default", { month: "short" })
    )
  );
  
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Nike Chart Colors
  const primary = "#000000";
  const secondary = "#E5E5E5";

  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      height: 370,
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: { horizontal: false, columnWidth: "40%", borderRadius: 0 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: months.length ? months : Array(12).fill("No Data"),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#a1a1aa", fontSize: "12px", fontFamily: "inherit" },
      },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        style: { colors: "#a1a1aa", fontSize: "12px", fontFamily: "inherit" },
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
    },
    tooltip: { theme: "light" },
  };

  const seriescolumnchart = [
    {
      name: "Website",
      data:
        salesData.website && salesData.website.length
          ? salesData.website
          : Array(12).fill(0),
    },
    {
      name: "Store",
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

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      const startTimestamp = Timestamp.fromDate(startOfYear);
      const endTimestamp = Timestamp.fromDate(endOfMonth);

      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef,
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        where("paymentStatus", "in", ["Paid", "Pending"])
      );

      const querySnapshot = await getDocs(ordersQuery);

      const updatedWebsiteOrders = new Array(12).fill(0);
      const updatedStoreOrders = new Array(12).fill(0);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt) {
          const monthIndex = createdAt.getMonth();
          if (data.from.toString().toLowerCase() === "website") {
            updatedWebsiteOrders[monthIndex]++;
          } else if (data.from.toString().toLowerCase() === "store") {
            updatedStoreOrders[monthIndex]++;
          }
        }
      });
      setSalesData({
        website: updatedWebsiteOrders,
        store: updatedStoreOrders,
      });
    } catch (error) {
      console.error(error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard title="Sales Overview">
      {loading ? (
        <div className="flex justify-center items-center h-[370px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <Chart
          options={optionscolumnchart}
          series={seriescolumnchart}
          type="bar"
          height={370}
          width={"100%"}
        />
      )}
    </DashboardCard>
  );
};

export default SalesOverview;

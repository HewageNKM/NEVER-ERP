import { auth, getToken } from "@/firebase/firebaseClient";
import axios from "axios";

export const getMonthlyOverviewAction = async (from: string, to: string) => {
  try {
    const token = await getToken();
    const res = await axios({
      method: "GET",
      url: "/api/v1/reports/overview/monthly?from=" + from + "&to=" + to,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getSalesReportAction = async (from: string, to: string) => {
  try {
    const token = await getToken();
    return await axios({
      method: "GET",
      url: `/api/v1/reports/sales?fromDate=${from}&toDate=${to}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getDailyOverviewAction = async () => {
  try {
    const token = await getToken();
    const res = await axios({
      method: "GET",
      url: "/api/v2/dashboard/daily",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getStocksReportAction = async () => {
  try {
    const token = await getToken();
    const res = await axios({
      method: "GET",
      url: "/api/v1/reports/stock",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getCashReportAction = async (from: string, to: string) => {
  try {
    const token = await getToken();
    return axios({
      method: "GET",
      url: "/api/v1/reports/cash?from=" + from + "&to=" + to,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getExpenseReportAction = async (from: string, to: string) => {
  try {
    const token = await getToken();
    const res = await axios({
      method: "GET",
      url: "/api/v1/reports/expense?from=" + from + "&to=" + to,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getYearlySalesAction = async (year?: number) => {
  try {
    const token = await getToken();
    const url = year
      ? `/api/v2/dashboard/sales?year=${year}`
      : "/api/v2/dashboard/sales";
    const res = await axios({
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getRecentOrdersAction = async (limit: number = 6) => {
  try {
    const token = await getToken();
    const res = await axios({
      method: "GET",
      url: `/api/v2/dashboard/recent-orders?limit=${limit}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { Order } from "@/model/Order";

export const fetchOrdersAction = async (page: number, size: number) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/orders?size=${size}&page=${page}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getOrdersByDateAction = async (date: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/orders/date?date=${date}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const updateAOrderAction = async (order: Order) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "PUT",
      url: `/api/v1/orders/${order.orderId}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(order),
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

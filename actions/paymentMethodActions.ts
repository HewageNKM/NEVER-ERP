import { auth, getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { PaymentMethod } from "@/model/PaymentMethod";

export const getAllPaymentMethodAction = async () => {
  try {
    const token = await getToken();
    let response = await axios({
      method: "GET",
      url: "/api/v1/payment-methods",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const createPaymentMethodAction = async (
  paymentMethod: PaymentMethod
) => {
  try {
    const token = await getToken();
    let response = await axios({
      method: "POST",
      url: "/api/v1/payment-methods",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(paymentMethod),
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const updatePaymentMethodAction = async (
  paymentMethod: PaymentMethod
) => {
  try {
    const token = await getToken();
    return axios({
      method: "PUT",
      url: `/api/v1/payment-methods/${paymentMethod.paymentId.toLowerCase()}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(paymentMethod),
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

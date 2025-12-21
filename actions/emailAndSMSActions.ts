import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { Email } from "@/model/Email";
import { SMS } from "@/model/SMS";

export const getAllEmailsAction = async (page: number, size: number) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/emails?size=${size}&page=${page}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const sendEmailAction = async (email: Email) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/v1/emails`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify(email),
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const deleteEmailByIdAction = async (emailId: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "DELETE",
      url: `/api/v1/emails/${emailId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const sendSMSAction = async (sms: SMS) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: "/api/v1/sms",
      data: JSON.stringify(sms),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const getAllSMSAction = async (page: number, size: number) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/sms?size=${size}&page=${page}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

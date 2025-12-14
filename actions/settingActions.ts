import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";

export const addBannerAction = async (data: FormData) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/v2/settings/ecom-web/banners`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      data: data,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getBannersAction = async () => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v2/settings/ecom-web/banners`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const deleteBannerAction = async (id: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "DELETE",
      url: `/api/v2/settings/ecom-web/banners/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

// ============ PROMOTIONS ACTIONS ============

export const addPromotionAction = async (data: FormData) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/v2/settings/ecom-web/promotions`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      data: data,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getPromotionsAction = async () => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v2/settings/ecom-web/promotions`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const deletePromotionAction = async (id: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "DELETE",
      url: `/api/v2/settings/ecom-web/promotions/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

// ============ NAVIGATION ACTIONS ============

export const getNavigationAction = async () => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v2/settings/ecom-web/navigation`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const saveNavigationAction = async (data: any) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/v2/settings/ecom-web/navigation`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: data,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

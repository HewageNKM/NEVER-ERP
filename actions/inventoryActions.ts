"use client";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { Item } from "@/model";

export const fetchInventoryAction = async (size: number, page: number) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/inventory?size=${size}&page=${page}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const fetchAItemAction = async (itemId: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/inventory/${itemId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const updateAItemAction = async (item: Item) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "PUT",
      url: `/api/v1/inventory/${item.itemId}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(item),
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const addAItem = async (item: Item) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/v1/inventory`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(item),
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const uploadAFileAction = async (file: File, path: string) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await axios({
      method: "POST",
      url: `/api/v1/storage`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: formData,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const deleteAItemAction = async (itemId: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "DELETE",
      url: `/api/v1/inventory/${itemId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const deleteAFileAction = async (path: string) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "DELETE",
      url: `/api/v1/storage?path=${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getPopularItemsAction = async (
  size: number,
  startDate: string,
  endDate: string
) => {
  try {
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v2/master/products/popular?size=${size}&startDate=${startDate}&endDate=${endDate}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

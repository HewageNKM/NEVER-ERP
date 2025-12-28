import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { User } from "@/model/User";

export const getUsersAction = async (page: number, size: number) => {
  try {
    const token = await getToken();
    const response = await axios({
      url: `/api/v1/users?page=${page}&size=${size}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export interface GetUsersV2Params {
  page: number;
  size: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface GetUsersV2Response {
  users: User[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export const getUsersV2Action = async (
  params: GetUsersV2Params
): Promise<GetUsersV2Response> => {
  try {
    const token = await getToken();
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.search && { search: params.search }),
      ...(params.role && { role: params.role }),
      ...(params.status && { status: params.status }),
    });

    const response = await axios({
      url: `/api/v2/users?${queryParams.toString()}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const addNewUserAction = async (data: User) => {
  try {
    const token = await getToken();
    const response = await axios({
      url: `/api/v2/users`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data),
    });
    return response.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const deleteUserByIdAction = async (id: string) => {
  try {
    const token = await getToken();
    axios({
      url: `/api/v2/users/${id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const updateUserByIdAction = async (data: User) => {
  try {
    const token = await getToken();
    axios({
      url: `/api/v2/users/${data.userId}`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify(data),
    });
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

import { auth, getToken } from "@/firebase/firebaseClient";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "@firebase/auth";
import axios from "axios";

export const authenticateUserAction = async (
  email: string,
  password: string
) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await getToken();
    const response = await axios({
      method: "GET",
      url: `/api/v1/users/login/${credential.user.uid}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const checkUserAction = async (uid: string, token: string) => {
  try {
    const response = await axios({
      method: "GET",
      url: `/api/v1/users/login/${uid}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const sendPasswordResetLinkAction = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

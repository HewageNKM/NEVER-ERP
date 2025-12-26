import { auth, getToken } from "@/firebase/firebaseClient";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import axios from "axios";

export const logoutUserAction = async () => {
  try {
    await signOut(auth);
    await axios({
      method: "POST",
      url: `/api/auth/logout`,
    });
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const authenticateUserAction = async (
  email: string,
  password: string
) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await getToken();
    const response = await axios({
      method: "POST",
      url: `/api/auth/login`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ uid: credential.user.uid }),
    });
    return response.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const checkUserAction = async (uid: string, token: string) => {
  try {
    const response = await axios({
      method: "POST",
      url: `/api/auth/login`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ uid: uid }),
    });
    return response.data;
  } catch (e: any) {
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

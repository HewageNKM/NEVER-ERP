"use client";
import React, { ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/authSlice/authSlice";
import { onAuthStateChanged } from "@firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { checkUserAction } from "@/actions/authActions";
import { useRouter } from "next/navigation";
import { User } from "@/model/User";

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const newVar: User = await checkUserAction(user.uid, token);
          if (newVar) {
            console.log("User found");
            window.localStorage.setItem("nvrUser", JSON.stringify(newVar));
            dispatch(setUser(newVar));
          } else {
            dispatch(setUser(null));
            console.error("User not found");
            window.localStorage.removeItem("nvrUser");
            router.replace("/unauthorized");
          }
        } catch (e) {
          dispatch(setUser(null));
          console.log("Error fetching user", e);
          console.error(e);
          window.localStorage.removeItem("nvrUser");
          router.replace("/unauthorized");
        }
      } else {
        console.log("No user found");
        window.localStorage.removeItem("nvrUser");
        dispatch(setUser(null));
        router.replace("/unauthorized");
      }
    });
  }, []);
  return <>{children}</>;
};

export default GlobalProvider;

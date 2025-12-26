import { configureStore } from "@reduxjs/toolkit";
import authSlice from "@/lib/authSlice/authSlice";
import posSlice from "@/lib/posSlice/posSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      authSlice,
      pos: posSlice,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

import { createSlice } from "@reduxjs/toolkit";
import { User } from "@/model/User";

interface Interface {
  currentUser: User | null;
  loading: boolean;
}

const initialState: Interface = {
  currentUser: null,
  loading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.currentUser = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer;

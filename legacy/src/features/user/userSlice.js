import { createSlice } from '@reduxjs/toolkit';


const initialState = {
  logged: false,
  username: null,
  token: null,
  authorities: [],
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    login: (state, action) => {
      state.logged = true;
      state.username = action.payload.username;     
      state.token = action.payload.token;
      state.authorities = action.payload.authorities;
    },
    logout: (state, action) => {
      state.logged = false;
      state.username = null;
      state.token = null;
      state.authorities = []
    },
  }
});

export const { login, logout } = userSlice.actions;

export const user_state = (state) => state.user;

export default userSlice.reducer;

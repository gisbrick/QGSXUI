import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

export const generalParamsSlice= createSlice({
    name: "generalParams",
    initialState: initialState,
    reducers: {
        registrarParams : (state, { payload }) => {
            //console.log("paylod", payload)
            state.push(...payload)
        }
    }
})

export const { registrarParams } = generalParamsSlice.actions;

export const generalParams_state = (state) => state.generalParams;

export default generalParamsSlice.reducer;
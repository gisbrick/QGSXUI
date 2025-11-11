import { createSlice } from '@reduxjs/toolkit';

const initialState = { value : true};

export const querySlice = createSlice({
    name: 'query',
    initialState,
    reducers: {
        cambio: (state) => {
            state.value = !state.value
        }
    }
});

export const { cambio } = querySlice.actions;

export const query_state = (state) => state.query;

export default querySlice.reducer;
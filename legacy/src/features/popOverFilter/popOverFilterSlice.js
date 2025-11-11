import { createSlice } from '@reduxjs/toolkit';

const initialState = { value : false};

export const popOverFilterSlice = createSlice({
    name: 'popoverFilter',
    initialState,
    reducers: {
        cerrarPopoverFilter: (state) => {
            state.value = !state.value
        }
    }
});

export const { cerrarPopoverFilter } = popOverFilterSlice.actions;

export const popoverFilter_state = (state) => state.popOverFilter;

export default popOverFilterSlice.reducer;
import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

export const favoriteAppsSlice = createSlice({
    name :"favoriteApps",
    initialState,
    reducers: {
        addFavorite : (state, {payload}) => {
            //console.log("app state", payload)
            let fav = state.find((fav) => fav.idUntApp == payload.idUntApp)
            //console.log("existe fav", fav)
            if(fav) {
                let result = state.filter((fav) => fav.idUntApp !== payload.idUntApp);
                //console.log("result", result)
                state.splice(0, state.length)
                state.push(...result)
            }else {
                state.push(payload)
            }


        },
    }
});

export const {addFavorite } = favoriteAppsSlice.actions;

export const favoriteApps_state = (state) => state.favoriteApps;

export default favoriteAppsSlice.reducer;
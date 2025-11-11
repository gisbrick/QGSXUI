import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import languageReducer from '../features/language/languageSlice';
import userReducer from '../features/user/userSlice';
import queryReducer from '../features/query/querySlice'
import featuresReducer from '../features/features/featuresSlice';
import generalParamsReducer from '../features/generalParams/generalParamsSlice';
import favoriteAppsReducer from '../features/favoriteApps/favoriteAppsSlice';
import popOverFilterReducer from '../features/popOverFilter/popOverFilterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    language: languageReducer,
    user: userReducer,
    query: queryReducer,
    features: featuresReducer,
    generalParams : generalParamsReducer,
    favoriteApps : favoriteAppsReducer,
    popOverFilter: popOverFilterReducer,
  },
});

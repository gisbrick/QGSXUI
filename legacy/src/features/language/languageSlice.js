import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import i18n from "i18next";
import es_ES from 'antd/es/locale/es_ES';
import en_GB from 'antd/es/locale/en_GB';

const initialState = {
  lang: 'en',
  antd: null
};


export const languageSlice = createSlice({
  name: 'language',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setLanguage: (state, action) => {
      state.lang = action.payload;     
   
      i18n.changeLanguage(state.lang); //No funciona, VALORAR SI NO UTILIZAMOS EL SLICE

      if(state.lang == "es"){
        state.antd = es_ES;
      }
      else if(state.lang == "en"){
        state.antd = en_GB;
      }
      else{
        state.antd = null;
      }
    },
   
  }
});

export const { setLanguage } = languageSlice.actions;

export const selectLang = (state) => state.language.lang;
export const selectLangAntd = (state) => state.language.antd;

export default languageSlice.reducer;

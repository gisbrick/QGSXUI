import i18next from "i18next";
import { Tabs, theme } from "antd";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { generalParams_state } from "../../../features/generalParams/generalParamsSlice";
import StylesParamComponent from "../../../components/manager/params/style/styleParamComponent";
import { getBackgroundColorPrimary } from "../../../utilities/paramsUtils";
import HomeParamComponent from "../../../components/manager/params/home/homeParamComponent";


const ParamPage = () => {

  const state_params = useSelector(generalParams_state)

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [colorbackground, setColorBackground] = useState("")

  const items = [
    {
      key: 'styles',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.params.label')}</div>,
      children: <StylesParamComponent colorbackground={colorbackground}></StylesParamComponent>,
    },
    {
      key: 'home',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.home.label')}</div>,
      children: <HomeParamComponent colorbackground={colorbackground}></HomeParamComponent>,
    }
  ];

  /**
* En el useEffect se obtienen los colores recuperados de base de datos
*/
  useEffect(() => {
    if (state_params.length > 0) {

      let colorPrimary = getBackgroundColorPrimary(state_params)

      if (colorPrimary) {
        setColorBackground(colorPrimary)
      }


      //Si no hay color en base de datos se fija el color por defecto
    } else {
      setColorBackground(colorBgContainer)
    }
  }, [])

  return (
    <>
      <Tabs defaultActiveKey="styles" items={items} tabBarStyle={{ paddingLeft: "5px", background: colorbackground }} />
    </>
  );
}

export default ParamPage;
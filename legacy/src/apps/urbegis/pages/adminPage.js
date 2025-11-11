import { Tabs, theme } from "antd";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import i18next from "i18next";

import { generalParams_state } from "../../../features/generalParams/generalParamsSlice";
import ListUserComponent from "../../../components/manager/user/listUserComponent";
import ListUnitComponent from "../../../components/manager/unit/listUnitComponent";
import { getBackgroundColorPrimary } from "../../../utilities/paramsUtils";


function AdminPage() {

  const state_params = useSelector(generalParams_state)

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [colorbackground, setColorBackground] = useState("")

  const items = [
    {
      key: 'users',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.user.label')}</div>,
      children: <ListUserComponent colorbackground={colorbackground}></ListUserComponent>,
    },
    {
      key: 'units',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.unit.label')}</div>,
      children: <ListUnitComponent colorbackground={colorbackground}></ListUnitComponent>,
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
      <div className="container-table">
        <Tabs defaultActiveKey="users" items={items} tabBarStyle={{ paddingLeft: "5px", background: colorbackground }} />
      </div>
    </>
  );
}

export default AdminPage;

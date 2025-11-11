import { Col, Row, Tabs, theme } from "antd";
import i18next from "i18next";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

import { generalParams_state } from "../../../features/generalParams/generalParamsSlice";
import ConfigAppResourcesComponent from "../../../components/manager/config/configAppResourcesComponent";
import ConfigUnitUsersPermissionsComponent from "../../../components/manager/config/configUnitUsersPermissionsComponent";
import ConfigUnitMediaResourceGroupComponent from "../../../components/manager/config/configUnitMediaResourceGroupComponent";
import { getBackgroundColorPrimary } from "../../../utilities/paramsUtils";

function ManagerPage() {

  const state_params = useSelector(generalParams_state)
  const [openApps, setOpenApps] = useState(true)
  const [openSecurity, setOpenSecurity] = useState(false)
  const [openMediaGroup, setOpenMediaGroup] = useState(false)

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [colorBackground, setColorBackground] = useState("")

  const items = [
    {
      key: 'users',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.app.label')}</div>,
      children: <Row>
        <Col span={24} offset={0}><ConfigAppResourcesComponent colorBackground={colorBackground} openApps={openApps}></ConfigAppResourcesComponent>
        </Col>
      </Row>
    },
    {
      key: 'security',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.security.label')}</div>,
      children: <Row>
        <Col span={24} offset={0}><ConfigUnitUsersPermissionsComponent colorBackground={colorBackground} openSecurity={openSecurity}></ConfigUnitUsersPermissionsComponent>
        </Col>
      </Row>,
    },
    {
      key: 'mediagroup',
      label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:"15px"}}>{i18next.t('manager.mediagroup.label')}</div>,
      children: <Row>
        <Col span={24} offset={0}><ConfigUnitMediaResourceGroupComponent colorBackground={colorBackground} openMediaGroup={openMediaGroup}></ConfigUnitMediaResourceGroupComponent>
        </Col>
      </Row>
    }
  ];

  const changeTabOpenSelect = (tabName) => {
    if(tabName =="users") {
      setOpenApps(true)
      setOpenSecurity(false)
      setOpenMediaGroup(false)
    }
    else if(tabName == "security") {
      setOpenApps(false)
      setOpenSecurity(true)
      setOpenMediaGroup(false)
    }
    else {
      setOpenApps(false)
      setOpenSecurity(false)
      setOpenMediaGroup(true)
    }
  }

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
        <Tabs onTabClick={(e)=> {changeTabOpenSelect(e)}} defaultActiveKey="users" items={items} tabBarStyle={{ paddingLeft: "5px", background: colorBackground }} />
      </div>
    </>
  );

}

export default ManagerPage;

import ListComponent from "../components/list/listComponent";
import ListComponentPaged from "../components/list/listComponentPaged";
import ConfigAppResourcesComponent from "../components/manager/config/configAppResourcesComponent";
import ConfigUnitUsersPermissionsComponent from "../components/manager/config/configUnitUsersPermissionsComponent";
import ListUnitComponent from "../components/manager/unit/listUnitComponent";
import ListUserComponent from "../components/manager/user/listUserComponent";
import LoginComponent from "../components/security/loginComponent";
import AntTree from "../pruebas/antTree";
import { HasRole, IsAdmin, IsManager } from "../utilities/SecurityUtil";
import DemoPage01 from "./demo/demoPage01";
import DemoPage02 from "./demo/demoPage02";
import DemoPage03 from "./demo/demoPage03";

function DemoApp() {
  return (
    <>

ListUnitComponen PAGED:<br /><br />
      <div style={{ width: "1000px" }}>
      <ListComponentPaged map={{
          unit: "unit01",
          permission: null,
          map: "test3.qgz"
        }} layer={"Poligono"}></ListComponentPaged>
      </div>    <br /><br />

      ListUnitComponen:<br /><br />
      <div style={{ width: "1000px" }}>
      <ListComponent height={400} map={{
          unit: "unit01",
          permission: null,
          map: "test3.qgz"
        }} layer={"Poligono"}></ListComponent>
      </div>    <br /><br />
  {/*}

     ANTTREE:<br /><br />
      <div style={{ width: "1000px" }}>
        <AntTree></AntTree>
      </div>    <br /><br />


      LOGIN:<br /><br />
      <div style={{ width: "1000px" }}>
        <LoginComponent></LoginComponent>
      </div>    <br /><br />

      {IsManager() && <>
        APLICACIONES:<br /><br />
        <div style={{ width: "1000px" }}>
          <ConfigAppResourcesComponent></ConfigAppResourcesComponent>
        </div>    <br /><br />
      </>}

      {IsAdmin() && <>
        USUARIOS:<br /><br />
        <div style={{ width: "1000px" }}>
          <ListUserComponent></ListUserComponent>
        </div>    <br /><br />
      </>}

      {IsAdmin() && <>
        UNIDADES:<br /><br />
        <div style={{ width: "1000px" }}>
          <ListUnitComponent></ListUnitComponent>
        </div>    <br /><br />
      </>}

      {IsManager() && <>
        PERMISOS:<br /><br />
        <div style={{ width: "1000px" }}>
          <ConfigUnitUsersPermissionsComponent></ConfigUnitUsersPermissionsComponent>
        </div>    <br /><br />
      </>}
        */}

      {/*
    <>
      DEMO APP: <br /><br />
      <DemoPage01></DemoPage01><br /><br />
      <DemoPage02></DemoPage02><br /><br />
      <DemoPage03></DemoPage03><br /><br />

      ListUnitComponent:<br /><br />
      <div style={{ width: "1000px" }}>
        <ListUnitComponent></ListUnitComponent>
      </div>    <br /><br />

      ListUserComponent:<br /><br />
      <div style={{ width: "1000px" }}>
        <ListUserComponent></ListUserComponent>
      </div>    <br /><br />

    </>
  */}
    </>
  );
}

export default DemoApp;

import i18next from "i18next";
import AppSelectComponent from "../../../components/public/appSelectComponent";
import AppSelectComponentMobile from "../../../components/public/appSelectComponentMobile";
import { BrowserView, MobileView } from "react-device-detect";

function ApplicationsPage({ renderApp, favouriteAppsSelect }) {

  return (
    <>
      <BrowserView>
        <AppSelectComponent renderApp={renderApp} languaje={i18next.language} favouriteAppsSelect={favouriteAppsSelect}></AppSelectComponent>
      </BrowserView>
      <MobileView>
        <AppSelectComponentMobile renderApp={renderApp} languaje={i18next.language} favouriteAppsSelect={favouriteAppsSelect}></AppSelectComponentMobile>
      </MobileView>
    </>
  );
}

export default ApplicationsPage;

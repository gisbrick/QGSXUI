import {Route, Routes, useNavigate} from "react-router";
import MapLayersTable from "./components/sgvmap/widgets/management/tables/MapLayersTable";
import {Button} from "antd";
import {BrowserRouter} from "react-router-dom";
import React from "react";
import i18next from "i18next";

const TemporaryNav = () =>{

    const navigate = useNavigate();

    return (
        <>
            <div className="App">
            <Button type="primary" onClick={() => {
                navigate('/maps');
            }} ghost>{i18next.t('common.maps')}</Button>
            <Button type="primary" onClick={() => {
                navigate('/mapLayers');
            }} ghost>{i18next.t('common.map_layers.map_layers')}</Button>
            </div>
        </>
    )
}
export default TemporaryNav;
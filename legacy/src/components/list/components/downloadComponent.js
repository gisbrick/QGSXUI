import { DownOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Menu, Select, Space, Switch } from "antd";
import i18next from "i18next";
import {useRef, useEffect} from "react"
import { ServicesConfig } from "../../../service/servicesConfig";
import { store } from "../../../app/store";
import { QgisService } from "../../../service/qgisService";

const DownloadComponent = ({ map, QGISPRJ, layer, qgisLayer, mapView, selection, setStepDownload }) => {

    const refDownload = useRef(null)

    const download = (format) => {
        let props = {}
        props["CRS"] = "EPSG:25830" //TODO Sacar de un properties o del proyecto... 
        props["SERVICE"] = "WFS"
        props["REQUEST"] = "GetFeature"
        props["VERSION"] = "1.3.0"
        props["OUTPUTFORMAT"] = format      
        props["TYPENAME"] = qgisLayer.name.replaceAll(" ", "_")
        if(qgisLayer.filter){
            props["EXP_FILTER"] = qgisLayer.filter      
        }

        if (qgisLayer.sortby && qgisLayer.sortType){
            props["SORTBY"] = qgisLayer.sortby + " " + qgisLayer.sortType
        } 
        
         //Añadimos el token si el usuario está logueado
         const state = store.getState();
         if (state.user.logged) {
            props["TOKEN"] = state.user.token
         }
       
        //TODO añadir filtros espaciales y alfanuméricos

        let urlParams = "";
        for (let key in props) {
            urlParams = urlParams + "&" + key + "=" + props[key]
        }
        let url = ServicesConfig.getBaseUrl() + "/qgis?MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + encodeURI(urlParams) + "&FEATUREID=" + (selection ? selection.join(",") : "")//"&"+ new URLSearchParams(printProps).toString()
        window.open(url, '_blank');

    }

    const getDownloadOptions = () => {
        let out = []
        if (qgisLayer.has_geometry) {
            out.push(...[
                {
                    key: 'shp',
                    label: <a onClick={() => download('shp')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "ESRI Shapefile (shp)" })}
                    </a>
                },
                {
                    key: 'geojson',
                    label: <a onClick={() => download('geojson')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "Geojson (geojson)" })}
                    </a>
                },
                /*{
                    key: 'gml3',
                    label: <a onClick={() => download('gml3')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "GML (gml)" })}
                    </a>
                },*/
                {
                    key: 'KML',
                    label: <a onClick={() => download('KML')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "KML (kml)" })}
                    </a>
                },
                {
                    key: 'Gpkg',
                    label: <a onClick={() => download('Gpkg')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "Gpkg (gpkg)" })}
                    </a>
                },
                {
                    key: 'GPX',
                    label: <a onClick={() => download('GPX')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "GPX (gpx)" })}
                    </a>
                }/*,
                {
                    key: 'Mapinfo File',
                    label: <a onClick={() => download('Mapinfo File')}>
                        {i18next.t('common.tools.download.downloadTo', { format: "Mapinfo File (tab)" })}
                    </a>
                }*/
            ]);
        }

        out.push(...[
            {
                key: 'XLSX',
                label: <a onClick={() => download('XLSX')}>
                    {i18next.t('common.tools.download.downloadTo', { format: "Excel (xlsx)" })}
                </a>
            },
            {
                key: 'CSV',
                label: <a onClick={() => download('CSV')}>
                    {i18next.t('common.tools.download.downloadTo', { format: "CSV (csv)" })}
                </a>
            }
        ]);

        return out;
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const stepsHelp = () => {
        let steps = []

        steps.push({
            title: i18next.t('common.tools.help.table.download.link.title'),
            description: i18next.t('common.tools.help.table.download.link.description'),
            target: () => refDownload.current,
          })

          setStepDownload(steps)
    }

    useEffect(()=> {
        stepsHelp()
    }, [])

    return (
        <>
            {
                <Dropdown menu={{ items: getDownloadOptions() }}>
                    <a ref={refDownload} onClick={(e) => e.preventDefault()}>
                        <Space>
                            <DownloadOutlined />
                            <div className="reader">{i18next.t('common.tools.download.name')}</div>
                            <DownOutlined />
                        </Space>
                    </a>
                </Dropdown>}


            {/*
            <Select
                showSearch
                placeholder={i18next.t('common.tools.download.name')}
                optionFilterProp="children"
                onChange={(e) => {
                    if (e == null) {
                      
                    }
                    else {
                     
                    }
                }}
                filterOption={filterOption}
                options={getDownloadOptions()}
            />*/}
        </>
    )
};
export default DownloadComponent;
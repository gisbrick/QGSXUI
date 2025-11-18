import { Button, Card, Checkbox, Drawer, Flex, Select, Space, Tooltip } from 'antd';
import { useContext, useEffect, useState } from 'react';
import 'font-gis/css/font-gis.css';
import { IDENA_baseMaps } from '../../../../utilities/leaflet_idena_utilities';
import './ToolBaseMaps.css';
import { ConfigMapContext } from '../../../../context/configMapProvider';
import { FilterFeatureContext } from '../../../../context/filterFeaturesProvider';
import { MapViewContext } from '../../../../context/mapViewProvider';
import { isMobile } from 'react-device-detect';

const ToolFilter = ({ mapView, selectedTool, setSelectedTool, action, toolsPanes }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/
    //https://fontawesome.com/v4/icon/download

    const [showFilter, setShowFilter] = useState();

    toolsPanes.hidePanes["ToolFilter"] = setShowFilter;

    const renderFilter = () => {
        return <Card title="" variant="borderless" style={{ width: 300 }}>
            <FilterConstructor mapView={mapView} setShowFilter={setShowFilter}></FilterConstructor>
        </Card>
    }


    return (
        <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}>
            <Tooltip title={"Filtrar los elementos del mapa"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => {
                        toolsPanes.hide();
                        setShowFilter(!showFilter);
                    }}>
                    {<i className="fa fa-filter"></i>}


                </Button>
            </Tooltip>
            {!isMobile && <div style={{ position: 'relative', width: '100%' }}
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}>
                {showFilter && <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }}>
                    {renderFilter()}
                </div>}
            </div>}
            {isMobile && <Drawer
                title="Filtros"
                placement="right"
                closable={true}
                onClose={() => setShowFilter(false)}
                open={showFilter}
                width={400}>
                <>
                    {renderFilter()}
                </>
            </Drawer>}
        </Space>
    );
};

export default ToolFilter;

const FilterConstructor = ({ setShowFilter }) => {

    const { config, dataPath } = useContext(ConfigMapContext)
    const { filters, setFilters, filtersOn, setFiltersOn, searchFilterObject, setSearchFilterObject } = useContext(FilterFeatureContext)
    const { mapView, deleteLayerFromMapView } = useContext(MapViewContext)

    if (mapView === undefined) {
        throw new Error("mapView undefined: ", mapView)
    }

    if (config === undefined) {
        throw new Error("config undefined: ", config)
    }

    if (mapView === undefined) {
        throw new Error("mapView undefined: ", mapView)
    }

    const [dataIntervenciones, setDataIntervenciones] = useState([])
    const [dataRestos, setDataRestos] = useState([])
    const [dataContextoCulturalInt, setDataContextoCulturalInt] = useState([])
    const [dataContextoCultural, setDataContextoCultural] = useState([])
    const [dataTiposResto, setDataTiposResto] = useState([])
    const [dataSubtiposResto, setDataSubtiposResto] = useState([])
    const [dataFilteredSubtiposResto, setDataFilteredSubtiposResto] = useState([])
    const [dataFasesHistoricas, setDataFasesHistoricas] = useState([])

    const getContextoCulturalOptions = (data) => {
        return data.map((feature) => { return { "value": feature.properties.cod_con_cul, "label": feature.properties.nom_con_cul } })
    }

    const getFasesHistoricasOptions = (data) => {
        return data.map((feature) => { return { "value": feature.properties.cod_fase, "label": feature.properties.nom_fase } })
    }

    const getSubtiposOptions = (data) => {
        return data.map((feature) => { return { "value": feature.properties.cod_subtipo_rest, "label": feature.properties.nom_subtipo_res, "extra": feature.properties.subtipo_tipo } })
    }

    const getTiposOptions = (data) => {
        return data.map((feature) => { return { "value": feature.properties.cod_rest, "label": feature.properties.nom_rest } })
    }

    const getData = async () => {

        const dataToFetch = config.layers.filter((layer) => layer.name == "Intervenciones")[0]?.filters.data_layers
        const arrayPromises = dataToFetch.map(async (geojson) => await fetch(`${dataPath}/${geojson}`))
        Promise.all(arrayPromises)
            .then(async (values) => {
                const dataInterv = await values[0].json()
                setDataIntervenciones(dataInterv ? dataInterv.features : [])
                const dataRest = await values[1].json() //bien

                setDataRestos(dataRest ? dataRest.features : [])
                const dataContextCult = await values[2].json()
                setDataContextoCulturalInt(dataContextCult ? dataContextCult.features : [])

                const dataSub = await values[3].json()
                setDataSubtiposResto(dataSub ? getSubtiposOptions(dataSub.features) : [])
                setDataFilteredSubtiposResto(dataSub ? getSubtiposOptions(dataSub.features) : [])

                const dataTip = await values[4].json()
                setDataTiposResto(dataTip ? getTiposOptions(dataTip.features) : [])

                const dataCont = await values[5].json()
                setDataContextoCultural(dataCont ? getContextoCulturalOptions(dataCont.features) : [])

                const dataFase = await values[6].json()
                setDataFasesHistoricas(dataFase ? getFasesHistoricasOptions(dataFase.features) : [])
            })
            .catch((error) => {
                console.log("Error obtaining data for filter: ", error)
            }).finally()

    }

    const onChangeOptions = (value, type) => {

        let body = structuredClone(searchFilterObject)
        switch (type) {
            case "contexto":
                body.contexto = value
                break;
            case "tipo":
                setDataFilteredSubtiposResto([...dataSubtiposResto].filter((subtipo) => subtipo.extra == value))
                body.tipo = value
                break;
            case "subtipo":
                body.subtipo = value
                break;
            case "fase":
                body.fase = value
                break;
            case "conservados":
                body.conservados = value
                break;
            case "insitu":
                body.insitu = value
                break;
            case "visibles":
                body.visibles = value
                break;
            case "visitables":
                body.visitables = value
                break;
            default:
                return;
        }
        setSearchFilterObject(body)
    }

    const getExcludedFeatures = () => {
        //console.log("searchFilterObject", searchFilterObject)
        //console.log("dataIntervenciones", dataIntervenciones)
        //console.log("dataRestos", dataRestos)
        //console.log("dataContextoCulturalInt", dataContextoCulturalInt)
        let excludedIntervenciones = []
        const cloneSearchFilterObject = structuredClone(searchFilterObject)
        const cloneDataIntervenciones = structuredClone(dataIntervenciones)
        const cloneDataRestos = structuredClone(dataRestos)
        const cloneDataContextoCulturalInt = structuredClone(dataContextoCulturalInt)

        const { contexto, tipo, subtipo, fase, conservados, insitu, visibles, visitables } = cloneSearchFilterObject

        const intervThatMatchCulturalContext = cloneDataIntervenciones.filter((intervencion) => {
            const { numero_int } = intervencion.properties

            const exitsContext = contexto ?
                (cloneDataContextoCulturalInt.find((item) => item.properties.numero_int == numero_int && item.properties.cod_con_cul == contexto) != undefined) :
                true
            return exitsContext
        }).map((intervencion) => intervencion.properties.numero_int)

        const intervThatMatchTipoSubtipoFase = cloneDataIntervenciones.filter((intervencion) => {
            const { numero_int } = intervencion.properties
            let flag = true
            if (!fase && !tipo && !subtipo) {
                return flag
            }
            let restos = cloneDataRestos.filter((resto) => resto.properties.numero_int == numero_int)
            if (fase) {
                restos = restos.filter((resto) => resto.properties.fase_hist == fase)
            }
            if (tipo) {
                restos = restos.filter((resto) => resto.properties.tipo_resto == tipo)
            }
            if (subtipo) {
                restos = restos.filter((resto) => resto.properties.subtipo_resto == subtipo)
            }

            flag = restos.length > 0

            return flag
        }).map((intervencion) => intervencion.properties.numero_int)

        const intervThatMatchConservados = cloneDataIntervenciones.filter((intervencion) => {
            if (!conservados && !insitu && !visibles && !visitables) {
                return true
            }
            const { numero_int } = intervencion.properties
            let restos = cloneDataRestos.filter((resto) => resto.properties.numero_int == numero_int)
            restos = restos
                .filter((item) => (item.properties.conserva_restos == 1) == conservados || !conservados)
                .filter((item) => (item.properties.restos_in_situ == 1) == insitu || !insitu)
                .filter((item) => (item.properties.restos_visibles == 1) == visibles || !visibles)
                .filter((item) => (item.properties.restos_visitables == 1) == visitables || !visitables)

            return restos.length > 0
        }).map((intervencion) => intervencion.properties.numero_int)

        //console.log("match context", intervThatMatchCulturalContext)
        //console.log("match tipo subtipo", intervThatMatchTipoSubtipoFase)
        //console.log("match conservados", intervThatMatchConservados)

        excludedIntervenciones = cloneDataIntervenciones.filter((item) =>
            !(intervThatMatchConservados.includes(item.properties.numero_int) &&
                intervThatMatchCulturalContext.includes(item.properties.numero_int) &&
                intervThatMatchTipoSubtipoFase.includes(item.properties.numero_int))
        ).map((item) => item.properties.numero_int)

        return excludedIntervenciones
    }

    const applyFilters = (theLayerName, theFieldToCheck, theArrayWithValuesOfExcludedFeatures) => {
        setFilters(
            prevState => ({
                ...prevState,
                layerName: theLayerName,
                fieldToCheck: theFieldToCheck,
                arrayWithValuesOfExcludedFeatures: theArrayWithValuesOfExcludedFeatures
            })
        )
        setFiltersOn(true)
    }

    const removeFilters = () => {
        setFilters(
            prevState => ({
                ...prevState,
                layerName: "",
                fieldToCheck: "",
                arrayWithValuesOfExcludedFeatures: []
            })
        )
        setFiltersOn(false)
        setSearchFilterObject({
            "contexto": "",
            "tipo": "",
            "subtipo": "",
            "fase": "",
            "conservados": false,
            "insitu": false,
            "visibles": false,
            "visitables": false

        })
    }

    useEffect(() => {
        getData()
    }, [])

    return (
        <>
            <Space direction='vertical'>
                <Space>
                    <Button type="primary" onClick={(e) => {
                        //alert("TODO - Apply filters");
                        // Logic to apply filters
                        setShowFilter(false);
                        applyFilters(["Intervenciones", "Puntos de intervención"], "numero_int", getExcludedFeatures())
                    }}>
                        Aplicar Filtros
                    </Button>
                    {<Button onClick={(e) => {
                        removeFilters()
                        setShowFilter(false);
                    }}
                    >Eliminar filtros</Button>}
                </Space>
                <Card title={"Contexto cultural"} size='small'>
                    <Select defaultValue={searchFilterObject.contexto} options={dataContextoCultural} onChange={(e) => { onChangeOptions(e, "contexto"); document.activeElement.blur(); }} style={{ width: "100%" }}></Select>
                </Card>
                <Card title={"Restos"} size='small'>
                    <Space direction='vertical'>
                        <span>Tipo</span>
                        <Select defaultValue={searchFilterObject.tipo} options={dataTiposResto} onChange={(e) => { onChangeOptions(e, "tipo"); document.activeElement.blur(); }} style={{ width: "100%" }}></Select>
                        <span>Subtipo</span>
                        <Select defaultValue={searchFilterObject.subtipo} options={dataFilteredSubtiposResto} onChange={(e) => { onChangeOptions(e, "subtipo"); document.activeElement.blur(); }} style={{ width: "100%" }}></Select>
                        <span>Fase histórica</span>
                        <Select defaultValue={searchFilterObject.fase} options={dataFasesHistoricas} onChange={(e) => { onChangeOptions(e, "fase"); document.activeElement.blur(); }} style={{ width: "100%" }}></Select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <Checkbox checked={searchFilterObject.conservados} onChange={(e) => { onChangeOptions(e.target.checked, "conservados") }}>Conservados</Checkbox>
                            <Checkbox checked={searchFilterObject.insitu} onChange={(e) => onChangeOptions(e.target.checked, "insitu")}>In situ</Checkbox>
                            <Checkbox checked={searchFilterObject.visibles} onChange={(e) => onChangeOptions(e.target.checked, "visibles")}>Visibles</Checkbox>
                            <Checkbox checked={searchFilterObject.visitables} onChange={(e) => { onChangeOptions(e.target.checked, "visitables") }}>Visitables</Checkbox>
                        </div>
                    </Space>
                </Card>
            </Space>
            <br />

        </>
    );
};


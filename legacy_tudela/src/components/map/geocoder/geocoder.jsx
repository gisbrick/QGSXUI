import React, { useContext } from 'react';
import './geocoder.css';
import { Button, Empty, Input, Space } from 'antd';
import { CloseCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { geocodeAddress, searchAddress } from '../../../utilities/leaflet_idena_utilities';
import confirm from 'antd/es/modal/confirm';
import { MapViewContext } from '../../../context/mapViewProvider';
import {isMobile} from 'react-device-detect';

const Geocoder = ({ }) => {

    const [resultType, setResultType] = useState();
    const [results, setResults] = useState();
    const [noResults, setNoResults] = useState();
    const [value, setValue] = useState();

    const { mapView, setMapView } = useContext(MapViewContext)

    const handleChangeValue = (value) => {
        //Si la longitud del texto es mayor a 3, iniciamos la búsqueda
        if (value.length > 1) {
            handleSearch(value);
        }
        else {
            //Limpia la lista de resultados
            clearResultsList();
            //Limpia la graphics layer
            mapView.graphicsLayer.clearLayers();
        }
        setValue(value);
    };

    const clearResultsList = () => {
        setNoResults(false);
        setResultType(null);
        setResults(null);
    }

    const handleSearch = async (value) => {

        //let v = value ? value : searchValue;
        if (value) {
            let response = await searchAddress(value, 'TUDELA');
            response.data.length > 0
            setResults(response.data);
            setResultType(response.type);
            setNoResults(response.data.length == 0);
        }
        else {
            //Limpia la lista de resultados
            clearResultsList();
            //Limpia la graphics layer
            mapView.graphicsLayer.clearLayers();
        }
    }

   
    return (
        <div className='geocoder' style={isMobile?{left: "0px", right: "0px", top: "0px", width: "100%"}:{  }}
            onMouseOver={(e) => {
                // Deshabilitar eventos sobre el mapa y layers
                mapView.dragging.disable(); // Deshabilita el arrastre
                mapView.off('click'); // Desactiva el evento de clic
                mapView.off('dblclick'); // Desactiva el evento de doble clic
                mapView.scrollWheelZoom.disable(); // Deshabilita el zoom con la rueda del ratón
                mapView.keyboard.disable(); // Deshabilita la interacción con el teclado

                // Si usas capas, puedes evitar que reciban eventos de ratón
                /*
                mapView.eachLayer((layer) => {
                    layer.off(); // Desactiva todos los eventos de cada capa
                });*/
            }} onMouseOut={(e) => {
                // Habilitar eventos sobre el mapa y layers
                mapView.dragging.enable(); // Habilita el arrastre
                mapView.on('click'); // Activa el evento de clic
                mapView.on('dblclick'); // Activa el evento de doble clic
                mapView.scrollWheelZoom.enable(); // Habilita el zoom con la rueda del ratón
                mapView.keyboard.enable(); // Habilita la interacción con el teclado

                // Si usas capas, puedes evitar que reciban eventos de ratón
                /*
                mapView.eachLayer((layer) => {
                    layer.on(); // Activa todos los eventos de cada capa
                });*/

            }}>

            <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}>
                <Input.Search
                    value={value}
                    onChange={(e) => {
                        handleChangeValue(e.target.value)
                    }}
                    onSearch={handleSearch}
                    placeholder="Buscar dirección..."
                    onClear={(e) => {
                        //handleChangeValue('');
                    }}
                    allowClear
                    style={{ width: 300 }}
                />

                {!noResults && results && (
                    <div className="results" style={{ minWidth: 300, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {results.map((result, index) => (
                            <ResultItem key={index} resultType={resultType} result={result} mapView={mapView} setValue={setValue} clearResultsList={clearResultsList}></ResultItem>
                        ))}
                    </div>
                )}
                {noResults &&
                    <div className="results" style={{ minWidth: 300, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white' }}>
                        <Empty description="No se encontraron resultados" />
                    </div>
                }

            </Space>

        </div>
    );
};

export default Geocoder;


const ResultItem = ({ resultType, result, mapView, setValue, clearResultsList }) => {
    const handleClick = async () => {

        
        mapView.dragging.enable(); // Habilita el arrastre
        mapView.on('click'); // Activa el evento de clic
        mapView.on('dblclick'); // Activa el evento de doble clic
        mapView.scrollWheelZoom.enable(); // Habilita el zoom con la rueda del ratón
        mapView.keyboard.enable(); // Habilita la interacción con el teclado

        //Mostarmos el resultado seleccionado en input de búsqueda
        if (resultType == "street") {
            setValue(result.VIA);
        }
        else {
            setValue(result.VIA + ", Nº " + result.PORTAL);
        }
        //Limpiamos resultados
        clearResultsList();

        let results = await geocodeAddress(result, resultType);

        //Limpia la graphics layer
        mapView.graphicsLayer.clearLayers();

        //Añadimos al mapa las calles
        if (resultType == "street") {

            let bounds = window.L.latLngBounds();
            results.features.forEach((feature) => {
                //Solo añadimos las líneas
                if (feature.geometry.type != "MultiLineString") return;
                const geojson = L.geoJSON(feature, {
                    style: {
                        color: 'blue',  // Color de la línea
                        weight: 4,      // Grosor de la línea
                        opacity: 0.8    // Transparencia
                    }
                }).bindPopup(result.VIA);
                // Añadir la línea a la Graphics Layer
                mapView.graphicsLayer.addLayer(geojson);
                bounds.extend(geojson.getBounds());
                /*
                const coordinates = feature.geometry.coordinates;
                const polyline = window.L.polyline(coordinates.map(coord => [coord[1], coord[0]]), { color: 'blue' }).addTo(mapView.graphicsLayer);
                bounds.extend(polyline.getBounds());
                */
            });
            mapView.fitBounds(bounds);

        }
        if (resultType == "portal") {
            let bounds = window.L.latLngBounds();
            results.features.forEach((feature) => {
                //Solo añadimos los puntos
                if (feature.geometry.type != "Point") return;
                const geojson = L.geoJSON(feature, {
                    style: {
                        color: 'blue',  // Color de la línea
                        weight: 4,      // Grosor de la línea
                        opacity: 0.8    // Transparencia
                    }
                }).bindPopup(result.VIA + ", Nº " + result.PORTAL);
                // Añadir la línea a la Graphics Layer
                mapView.graphicsLayer.addLayer(geojson);
                bounds.extend(geojson.getBounds());
                /*
                const coordinates = feature.geometry.coordinates;
                const polyline = window.L.polyline(coordinates.map(coord => [coord[1], coord[0]]), { color: 'blue' }).addTo(mapView.graphicsLayer);
                bounds.extend(polyline.getBounds());
                */
            });
            mapView.fitBounds(bounds);

        }
    };

    const renderStreet = () => {
        return <div style={{ width: '100%', textAlign: 'left' }}>
            <i class="fg-signpost"></i> {result.VIA}
        </div>;
    }

    const renderPortal = () => {
        return <div style={{ width: '100%', textAlign: 'left' }}>
            <i class="fg-pin"></i> {result.VIA + ", Nº " + result.PORTAL}
        </div>;
    }

    return (
        <Button onClick={handleClick} style={{ width: '100%', textAlign: 'left' }}>
            {resultType == "street" && renderStreet()}
            {resultType == "portal" && renderPortal()}
        </Button>
    );
};




//URL REQUEST
//https://idena.navarra.es/ogc/wfs

//Ejemplo 01:
/*
REQUEST=GetFeature
SERVICE=WFS
MAXFEATURES=500
VERSION=1.1.0
OUTPUTFORMAT=JSON
TYPENAME=IDENA:CATAST_Lin_CalleEje
PROPERTYNAME=ENTIDADC,VIA,CVIA,CENTIDADC,CMUNICIPIO
FILTER=
<ogc:Filter
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml">
    <ogc:And>
        <ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTINOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*tudela*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTINOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*TUDELA*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTIDADC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*tudela*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTIDADC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*TUDELA*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
        </ogc:Or>
        <ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIA</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*consti*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIA</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*CONSTI*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIANOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*consti*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIANOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*CONSTI*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
        </ogc:Or>
    </ogc:And>
</ogc:Filter>
*/

//Ejemplo 02:
/*
REQUEST=GetFeature
SERVICE=WFS
MAXFEATURES=500
VERSION=1.1.0
OUTPUTFORMAT=JSON
TYPENAME=IDENA:CATAST_Txt_Portal
PROPERTYNAME=ENTIDADC,VIA,PORTAL,CVIA,CENTIDADC,CMUNICIPIO
FILTER=
<ogc:Filter
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml">
    <ogc:And>
        <ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTIDADC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*consti*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTIDADC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*CONSTI*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTINOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*consti*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>ENTINOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*CONSTI*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
        </ogc:Or>
        <ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIA</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*tudela*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIA</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*TUDELA*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
            <ogc:Or>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIANOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*tudela*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
                <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                    <ogc:PropertyName>VIANOAC</ogc:PropertyName>
                    <ogc:Literal>
                        <![CDATA[*TUDELA*]]>
                    </ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Or>
        </ogc:Or>
        <ogc:Or>
            <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                <ogc:PropertyName>PORTAL</ogc:PropertyName>
                <ogc:Literal>
                    <![CDATA[10*]]>
                </ogc:Literal>
            </ogc:PropertyIsLike>
            <ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*">
                <ogc:PropertyName>PORTAL</ogc:PropertyName>
                <ogc:Literal>
                    <![CDATA[10*]]>
                </ogc:Literal>
            </ogc:PropertyIsLike>
        </ogc:Or>
    </ogc:And>
</ogc:Filter>
*/


//https://idena.navarra.es/ogc/wfs?service=WFS&request=GetFeature&version=1.1.0&outputFormat=JSON&srsname=EPSG%3A25830&typename=IDENA%3ACATAST_Txt_Portal&filter=%3CFilter+xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22+xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%3E%3CAnd%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECMUNICIPIO%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B232%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECENTIDADC%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B1%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3EPORTAL%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B2%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3C%2FAnd%3E%3C%2FFilter%3E&maxFeatures=1000

/*
service=WFS
request=GetFeature
version=1.1.0
outputFormat=JSON
srsname=EPSG%3A25830
typename=IDENA%3ACATAST_Txt_Portal
filter=%3CFilter+xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22+xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%3E%3CAnd%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECMUNICIPIO%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B232%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECENTIDADC%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B1%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3EPORTAL%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B2%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3C%2FAnd%3E%3C%2FFilter%3E
maxFeatures=1000

<Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
    <And>
        <PropertyIsEqualTo>
            <PropertyName>CMUNICIPIO</PropertyName>
            <Literal><![CDATA[232]]></Literal>
        </PropertyIsEqualTo>
        <PropertyIsEqualTo>
            <PropertyName>CENTIDADC</PropertyName>
            <Literal><![CDATA[1]]></Literal>
        </PropertyIsEqualTo>
        <PropertyIsEqualTo>
            <PropertyName>CVIA</PropertyName>
            <Literal><![CDATA[9098]]></Literal>
        </PropertyIsEqualTo>
        <PropertyIsEqualTo>
            <PropertyName>PORTAL</PropertyName>
            <Literal><![CDATA[2]]></Literal>
        </PropertyIsEqualTo>
    </And>
</Filter>


https://idena.navarra.es/ogc/wfs?service=WFS&request=GetFeature&version=1.1.0&outputFormat=JSON&srsname=EPSG%3A25830&typename=IDENA%3ACATAST_Lin_CalleEje%2CCATAST_Txt_Calle&filter=%3CFilter+xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22+xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%3E%3CAnd%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3C%2FAnd%3E%3C%2FFilter%3E&maxFeatures=1000

service=WFS
request=GetFeature
version=1.1.0
outputFormat=JSON
srsname=EPSG%3A25830
typename=IDENA%3ACATAST_Lin_CalleEje%2CCATAST_Txt_Calle
filter=%3CFilter+xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22+xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%3E%3CAnd%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3C%2FAnd%3E%3C%2FFilter%3E
maxFeatures=1000

<Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
    <And>
        <PropertyIsEqualTo>
            <PropertyName>CVIA</PropertyName>
            <Literal><![CDATA[9098]]></Literal>
        </PropertyIsEqualTo>
        <PropertyIsEqualTo>
            <PropertyName>CVIA</PropertyName>
            <Literal><![CDATA[9098]]></Literal>
        </PropertyIsEqualTo>
    </And>
</Filter>

*/
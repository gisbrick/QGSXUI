export function getDeleteXML(feature) {
    const featureIdArr = feature.id.split(".");
    const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
    const FID = featureIdArr[1];

    return `<?xml version="1.0" encoding="UTF-8"?>
   <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
       <wfs:Delete typeName="${TYPENAME}">
           <ogc:Filter>
               <ogc:FeatureId fid="${FID}"/>
           </ogc:Filter>
       </wfs:Delete>
   </wfs:Transaction>`
}

export function getDeleteMultipleXML(featuresIds) {
    let FILTERS = ""
    for (let i in featuresIds) {      
        const featureIdArr = featuresIds[i].split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        FILTERS = FILTERS + `<wfs:Delete typeName="${TYPENAME}">
                                <ogc:Filter>
                                    <ogc:FeatureId fid="${FID}"/>
                                </ogc:Filter>
                            </wfs:Delete>`
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
   <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
    ${FILTERS}
   </wfs:Transaction>`
}

export function getUpdateXML(qgisLayer, feature, properties, geometry) {

    const featureIdArr = feature.id.split(".");
    const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
    const FID = featureIdArr[1];

    const GEOMETRY = getFeatureGeometryAsXml(qgisLayer, feature, geometry);
    const PROPERTIES = getFeaturePropertiesAsXml(properties);

    return `<?xml version="1.0" encoding="UTF-8"?>
    <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
        <wfs:Update typeName="${TYPENAME}">${PROPERTIES}${GEOMETRY}<ogc:Filter><ogc:FeatureId fid="${FID}"/></ogc:Filter></wfs:Update>
    </wfs:Transaction>`;
    /*
     return `<?xml version="1.0" encoding="UTF-8"?>
     <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
         <wfs:Update typeName="t101d_comarcas">
         <wfs:Property>
             <wfs:Name>ccomarca</wfs:Name>
             <wfs:Value></wfs:Value>
         </wfs:Property>
         <wfs:Property>
             <wfs:Name>d_comarca</wfs:Name>
             <wfs:Value>aaa</wfs:Value>
         </wfs:Property>
         <wfs:Property>
             <wfs:Name>uri_aod</wfs:Name>
             <wfs:Value>bbbb</wfs:Value>
         </wfs:Property>
           <ogc:Filter>
             <ogc:FeatureId fid="33"/>
           </ogc:Filter>
         </wfs:Update>
     </wfs:Transaction>`;*/
}

export function getUpdateGeomXML(qgisLayer, feature, geometry) {

    const featureIdArr = feature.id.split(".");
    const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
    const FID = featureIdArr[1];

    const GEOMETRY = getFeatureGeometryAsXmlAux(qgisLayer, geometry);

    //Es necesario incluir como mínimo una de las propiedades.... por ahora solo voy a meter la primera
    let [firstKey] = Object.keys(feature.properties)
    let propertiesAux = {}
    propertiesAux[firstKey] = feature.properties[firstKey]

    const PROPERTIES = getGeometryPropertyAsXml(qgisLayer, geometry)



    return `<?xml version="1.0" encoding="UTF-8"?>
    <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
        <wfs:Update typeName="${TYPENAME}">${PROPERTIES}${GEOMETRY}<ogc:Filter><ogc:FeatureId fid="${FID}"/></ogc:Filter></wfs:Update>
    </wfs:Transaction>`;
    /*
     return `<?xml version="1.0" encoding="UTF-8"?>
     <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
         <wfs:Update typeName="t101d_comarcas">
         <wfs:Property>
             <wfs:Name>ccomarca</wfs:Name>
             <wfs:Value></wfs:Value>
         </wfs:Property>
         <wfs:Property>
             <wfs:Name>d_comarca</wfs:Name>
             <wfs:Value>aaa</wfs:Value>
         </wfs:Property>
         <wfs:Property>
             <wfs:Name>uri_aod</wfs:Name>
             <wfs:Value>bbbb</wfs:Value>
         </wfs:Property>
           <ogc:Filter>
             <ogc:FeatureId fid="33"/>
           </ogc:Filter>
         </wfs:Update>
     </wfs:Transaction>`;*/
}

export function getInsertXML(qgisLayer, properties, geometry) {


    const GEOMETRY = getFeatureGeometryAsXml(qgisLayer, null, geometry);
    const PROPERTIES = getInsertFeaturePropertiesAsXml(properties);

    //GEOMETRY = GEOMETRY?GEOMETRY:"" //Evitamos que meta el texto null

    const layerName = qgisLayer.name.replaceAll ? qgisLayer.name.replaceAll(" ", "_") : qgisLayer.name.replace(" ", "_");
    //console.log("layerName", layerName)
    //console.log("GEOMETRY", GEOMETRY)
    //console.log("PROPERTIES", PROPERTIES)
    return `<?xml version="1.0" encoding="UTF-8"?>
    <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
        <wfs:Insert idgen="GenerateNew">
        <qgs:${layerName}>
            ${GEOMETRY}${PROPERTIES}
        </qgs:${layerName}>
        </wfs:Insert>
    </wfs:Transaction>`;
}

function latLngToCommaSeparatedSpaceString(latLngs, closePolygon) {

    if (!latLngs) return "";

    if (Array.isArray(latLngs) && Array.isArray(latLngs[0])) return latLngToCommaSeparatedSpaceString(latLngs[0], closePolygon)

    var out = "";
    for (var i in latLngs) {
        out = out + latLngs[i].lng + "," + latLngs[i].lat + " ";
    }
    //Si es un polígono, lo cerramos añadiendo la última coordenada
    if (closePolygon) {
        out = out + latLngs[0].lng + "," + latLngs[0].lat + " ";
    }

    if (out.length > 2) {
        out = out.substr(0, out.length - 1);
    }
    return out;
}

function latLngToSpaceSeparatedSpaceString(latLngs) {

    if (Array.isArray(latLngs) && Array.isArray(latLngs[0])) return latLngToSpaceSeparatedSpaceString(latLngs[0])

    var out = "";
    for (var i in latLngs) {
        out = out + latLngs[i].lng + " " + latLngs[i].lat + " ";
    }
    if (out.length > 2) {
        out = out.substr(0, out.length - 1);
    }
    return out;
}

function getFeatureGeometryAsXml(qgisLayer, feature, geometry) {

    //TODO de momento ausumimos que todo son geometreías simples. Habría que implementar multigeometrías y agujeros

    //Si no tenemos geometría devolvemos nulo
    if (!geometry) return "";

    //Si no tenemos modificaciones en la geometría, no la actualizamos
    if (feature && feature.geometry && feature.geometry.coordinates == geometry.coordinates) {
        return "";
    }

    let newGeometry = getFeatureGeometryAsXmlAux(qgisLayer, geometry);
    return `<qgs:geometry>${newGeometry}</qgs:geometry>`;

}

function getFeatureGeometryAsXmlAux(qgisLayer, geometry) {

    let newGeometry = "";

    if (qgisLayer.wkbType_name.toUpperCase().indexOf("LINE") != -1) {
        if (qgisLayer.wkbType_name.toUpperCase().indexOf("MULTI") != -1) {
            newGeometry = '<gml:MultiLineString srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:lineStringMember>' +
                '<gml:LineString>' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:LineString>' +
                '</gml:lineStringMember>' +
                '</gml:MultiLineString>';
        } else {
            newGeometry = '<gml:LineString srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:LineString>';
        }
        newGeometry = geometry.coordinates ? newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(geometry.coordinates)) : "";
    }
    else if (qgisLayer.wkbType_name.toUpperCase().indexOf("POLYGON") != -1) {
        if (qgisLayer.wkbType_name.toUpperCase().indexOf("MULTI") != -1) {
            newGeometry = '<gml:MultiPolygon srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:polygonMember> ' +
                '<gml:Polygon>' +
                '<gml:outerBoundaryIs>' +
                '<gml:LinearRing>' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:LinearRing>' +
                '</gml:outerBoundaryIs>' +
                '</gml:Polygon>' +
                '</gml:polygonMember>' +
                '</gml:MultiPolygon>';
        } else {
            newGeometry = '<gml:Polygon srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:outerBoundaryIs>' +
                '<gml:LinearRing>' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:LinearRing>' +
                '</gml:outerBoundaryIs>' +
                '</gml:Polygon>';
        }
        newGeometry = geometry.coordinates ? newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(geometry.coordinates, true)) : "";

    }

    else if (qgisLayer.wkbType_name.toUpperCase().indexOf("POINT") != -1) {
        if (qgisLayer.wkbType_name.toUpperCase().indexOf("MULTI") != -1) {
            newGeometry = '<gml:MultiPoint srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:pointMember>' +
                '<gml:Point>' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:Point>' +
                '</gml:pointMember>' +
                '</gml:MultiPoint>';
        } else {
            newGeometry = '<gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                '</gml:coordinates>' +
                '</gml:Point>';
        }
        newGeometry = geometry.coordinates ? newGeometry.replace(new RegExp('{{coordinates}}', 'g'), geometry.coordinates[1] + "," + geometry.coordinates[0]) : "";
    }


    return newGeometry;

}

function getFeaturePropertiesAsXml(properties) {
    let out = "";
    if (properties) {
        for (let key in properties) {
            const NAME = key;
            let VALUE = "";
            let xml = `<wfs:Property><wfs:Name>${NAME}</wfs:Name>`;
            if (!isEmpty(properties[key])) {
                VALUE = escapeString(properties[key]);
                xml = xml.concat(`<wfs:Value>${VALUE}</wfs:Value>`)
            }
            xml = xml.concat("</wfs:Property>")
            out = out.concat(xml)
        }
    }
    return out;
}


function getGeometryPropertyAsXml(qgisLayer, geometry) {
    const NAME = "geometry";
    let VALUE = getFeatureGeometryAsXmlAux(qgisLayer, geometry);
    return `<wfs:Property><wfs:Name>${NAME}</wfs:Name><wfs:Value>${VALUE}</wfs:Value></wfs:Property>`;;
}

function getInsertFeaturePropertiesAsXml(properties) {
    let out = "";
    if (properties) {
        for (let key in properties) {
            const NAME = key;
            let VALUE = null;

            if (!isEmpty(properties[key])) {
                VALUE = escapeString(properties[key]);
            }
            if (VALUE) out = out.concat(`<qgs:${NAME}>${VALUE}</qgs:${NAME}>`)
        }
    }
    return out;
}

function isEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}

function escapeString(value) {
    if (value.replace) {
        if (value.replaceAll) {
            return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
        }
        else {
            return value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        /*
        return value.replaceAll(/\\n/g, "\\n")
        .replaceAll(/\\'/g, "\\'")
        .replaceAll(/\\"/g, '\\"')
        .replaceAll(/\\&/g, "\\&")
        .replaceAll(/\\r/g, "\\r")
        .replaceAll(/\\t/g, "\\t")
        .replaceAll(/\\b/g, "\\b")
        .replaceAll(/\\f/g, "\\f");*/

    }
    else {
        return value;
    }

}
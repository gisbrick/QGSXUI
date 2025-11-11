export function getDeleteXML(feature) {
    const featureIdArr = feature.id.split(".");
    const TYPENAME = featureIdArr[0];
    const FID = featureIdArr[1].replaceAll(" ", "_");

    return `<?xml version="1.0" encoding="UTF-8"?>
   <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
       <wfs:Delete typeName="${TYPENAME}">
           <ogc:Filter>
               <ogc:FeatureId fid="${FID}"/>
           </ogc:Filter>
       </wfs:Delete>
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

export function getInsertXML(qgisLayer, properties, geometry) {
    
    const GEOMETRY = getFeatureGeometryAsXml(qgisLayer, null, geometry);
    const PROPERTIES = getInsertFeaturePropertiesAsXml(properties);

    const layerName = qgisLayer.name.replaceAll?qgisLayer.name.replaceAll(" ", "_"):qgisLayer.name.replace(" ", "_");

    return `<?xml version="1.0" encoding="UTF-8"?>
    <wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
        <wfs:Insert idgen="GenerateNew">
        <qgs:${layerName}>
            ${GEOMETRY}${PROPERTIES}
        </qgs:${layerName}>
        </wfs:Insert>
    </wfs:Transaction>`;

    /*<?xml version="1.0" encoding="UTF-8"?>
<wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
  <wfs:Insert idgen="GenerateNew">
    <qgs:places>
      <qgs:geometry>
        <gml:Point srsDimension="2" srsName="http://www.opengis.net/def/crs/EPSG/0/4326">
          <gml:coordinates decimal="." cs="," ts=" ">-4.6167,48.3833</gml:coordinates>
        </gml:Point>
      </qgs:geometry>
      <qgs:name>Locmaria-Plouzané</qgs:name>
    </qgs:places>
  </wfs:Insert>
</wfs:Transaction> */
}

function latLngToCommaSeparatedSpaceString(latLngs) {

    if(Array.isArray(latLngs) && Array.isArray(latLngs[0]))return latLngToCommaSeparatedSpaceString(latLngs[0])

    var out = "";
    for (var i in latLngs) {
        out = out + latLngs[i].lng + "," + latLngs[i].lat + " ";
    }
    if (out.length > 2) {
        out = out.substr(0, out.length - 1);
    }
    return out;
}

function getFeatureGeometryAsXml(qgisLayer, feature, geometry) {

    //TODO de momento ausumimos que todo son geometreías simples. Habría que implementar multigeometrías y agujeros

    //Si no tenemos geometría devolvemos nulo
    if(!geometry)return null;

    //Si no tenemos modificaciones en la geometría, no la actualizamos
    if(feature && feature.geometry.coordinates == geometry.coordinates){
        return null;
    }
    
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
        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(geometry.coordinates));
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
        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(geometry.coordinates));
    } 
    
    else if (qgisLayer.wkbType_name.toUpperCase().indexOf("POINT") != -1) {
        if (qgisLayer.wkbType_name.toUpperCase().indexOf("MULTI") != -1) {
            newGeometry = '<gml:MultiPoint srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                    '<gml:multiPointMember>' +
                    '<gml:Point>' +
                    '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                    '</gml:coordinates>' +
                    '</gml:Point>' +
                    '</gml:multiPointMember>' +
                    '</gml:MultiPoint>';
        } else {
            newGeometry = '<gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                    '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                    '</gml:coordinates>' +
                    '</gml:Point>';
        }
        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), geometry.coordinates[1] + "," + geometry.coordinates[0]);
    }
    /*
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
        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(editNewElement.layer.getLatLngs()));

    } else if (qgisLayer.wkbType_name.toUpperCase().indexOf("POLYGON") != -1) {
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

        var latLngs = editNewElement.layer.getLatLngs()[0];
        latLngs.push(latLngs[0]);

        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), latLngToCommaSeparatedSpaceString(latLngs));
    } else if (editNewElement.editTools.type.toUpperCase().indexOf("POINT") != -1 || editNewElement.editTools.type.toUpperCase().indexOf("MARKER") != -1) {
        if (qgisLayer.wkbType_name.toUpperCase().indexOf("MULTI") != -1) {
            newGeometry = '<gml:MultiPoint srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                    '<gml:multiPointMember>' +
                    '<gml:Point>' +
                    '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                    '</gml:coordinates>' +
                    '</gml:Point>' +
                    '</gml:multiPointMember>' +
                    '</gml:MultiPoint>';
        } else {
            newGeometry = '<gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
                    '<gml:coordinates decimal="." cs="," ts=" ">{{coordinates}}' +
                    '</gml:coordinates>' +
                    '</gml:Point>';
        }
        newGeometry = newGeometry.replace(new RegExp('{{coordinates}}', 'g'), editNewElement.layer.getLatLng().lng + "," + editNewElement.layer.getLatLng().lat);
    }
    */
   
   return `<qgs:geometry>${newGeometry}</qgs:geometry>`;

    /*<qgs:geometry>
        <gml:Point srsDimension="2" srsName="http://www.opengis.net/def/crs/EPSG/0/4326">
          <gml:coordinates decimal="." cs="," ts=" ">-4.6167,48.3833</gml:coordinates>
        </gml:Point>
      </qgs:geometry> */
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
function getInsertFeaturePropertiesAsXml(properties) {
    let out = "";
    if (properties) {
        for (let key in properties) {
            const NAME = key;
            let VALUE = null;              
            
            if (!isEmpty(properties[key])) {
                VALUE = escapeString(properties[key]);               
            }
            if(VALUE)out = out.concat(`<qgs:${NAME}>${VALUE}</qgs:${NAME}>`)
        }
    }
    return out;
}

function isEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}

function escapeString(value) {
    if(value.replace){
        if(value.replaceAll){
            return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
        }
        else{
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
    else{
        return value;
    }
   
}
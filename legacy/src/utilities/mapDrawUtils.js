

const selectionColor = "#33fcff";
const selectionLineWidth = 10;
const selectionPolygonWidth = 10;

export function createVectorLayer(mapView, layer, qgisLayer) {
   
}


export function drawSelectionFeature(mapView,  graphicsLayer, feature, selection, selectionGraphics, qgisLayer) {
   
    if(qgisLayer.has_geometry && qgisLayer.wkbType_name.toUpperCase().includes("POINT")){
        drawSelectionFeaturePoint(mapView,  graphicsLayer, feature, selection,  selectionGraphics,  qgisLayer)
    }
    if(qgisLayer.has_geometry && qgisLayer.wkbType_name.toUpperCase().includes("LINE")){
        drawSelectionFeatureLine(mapView,  graphicsLayer, feature, selection,  selectionGraphics,  qgisLayer)
    }
    if(qgisLayer.has_geometry && qgisLayer.wkbType_name.toUpperCase().includes("POLYGON")){
        drawSelectionFeaturePolygon(mapView,  graphicsLayer, feature, selection, selectionGraphics,  qgisLayer)
    }
   
}

function drawSelectionFeaturePolygon(mapView,  graphicsLayer, feature, selection,  selectionGraphics, qgisLayer) {    
    let coordinatesAux = [...feature.geometry.coordinates];  
    let coordinates = switchCoordsPos(coordinatesAux);
    coordinates = formatPolCoordinatesArray(coordinates, []);  
    var graphic = window.L.polygon(coordinates, {color: selectionColor, opacity:1, fillOpacity: 0.7, weight: selectionPolygonWidth});
    graphic.addTo(graphicsLayer);
    //selectionGraphics[selection]={}
    if(!selectionGraphics.hasOwnProperty(selection)){
        selectionGraphics[selection]={}
    }
    selectionGraphics[selection]["_leaflet_id"] = graphic._leaflet_id;
}
function drawSelectionFeatureLine(mapView,  graphicsLayer, feature, selection,  selectionGraphics,  qgisLayer) {
    let coordinatesAux = [...feature.geometry.coordinates];  
    let coordinates = switchCoordsPos(coordinatesAux);
    coordinates = formatPolCoordinatesArray(coordinates, []);  
    var graphic = window.L.polyline(coordinates, {color: selectionColor, opacity:1, weight: selectionLineWidth});
    graphic.addTo(graphicsLayer);
    //selectionGraphics[selection]={}
    if(!selectionGraphics.hasOwnProperty(selection)){
        selectionGraphics[selection]={}
    }
    selectionGraphics[selection]["_leaflet_id"] = graphic._leaflet_id;
}

function drawSelectionFeaturePoint(mapView,  graphicsLayer, feature, selection,  selectionGraphics,  qgisLayer) {
    //let graphic = window.L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);    
    let coordinatesAux = [...feature.geometry.coordinates];   
    let coordinates = switchCoordsPos(coordinatesAux);

    //TODO esto hay que refinarlo para las capas multigeometría
    if(qgisLayer.wkbType_name.toUpperCase().includes("MULTI")){
        coordinates = coordinates[0]
    }

    let graphic = window.L.marker(coordinates);
    graphicsLayer.addLayer(graphic);
    graphic.addTo(graphicsLayer);
    //selectionGraphics[selection]={}
    if(!selectionGraphics.hasOwnProperty(selection)){
        selectionGraphics[selection]={}
    }
    selectionGraphics[selection]["_leaflet_id"] = graphic._leaflet_id;
}

function switchCoordsPos(coords){
    for (let i = 0; i < coords.length; i++) {
        if(isNaN(coords[i])){
            let coordinatesAux = [...coords[i]];
            coords[i] = switchCoordsPos(coordinatesAux)
        }
        else{
            if(coords.length == 2){
                // tenemos 2 coordenadas
                i++                
            } 
            if(coords.length == 3){
                // tenemos 3 coordenadacoordsora solo usamos 2 
                i++; i++;
                coords.splice(2, 1); 
            } 
            if(coords.length == 4){
                // tenemos 4 coordenadas (Z y M), por ahora solo usamos 2                 
                coords.splice(2, 2);
                i++; i++; i++;
            } 
           
            let coord1 = coords[0]
            let coord2 = coords[1]
            coords[0] = coord2;
            coords[1] = coord1;
        }
    }
    return coords;
}

function formatPolCoordinatesArray(coords, out){   
    for (let i = 0; i < coords.length; i++) {
        if(coords[i].length > 1){
            if(isNaN(coords[i][0])){
                out.push(formatPolCoordinatesArray(coords[i], []))
            }
            else{
                out.push(coords[i]);
            }
        }
        else{
            formatPolCoordinatesArray(coords[i], out)
        }
    }
    return out;
}
// Función para calcular la escala del mapa
// TODO revisar porque no va muy fina
export function getMapLeafletScale(map) {
    // Get the y,x dimensions of the map
    var y = map.getSize().y,
        x = map.getSize().x;
    // calculate the distance the one side of the map to the other using the haversine formula
    var maxMeters = map.containerPointToLatLng([0, y]).distanceTo(map.containerPointToLatLng([x, y]));
    // calculate how many meters each pixel represents
    var MeterPerPixel = maxMeters / x;

    // calculate the scale
    var scale = MeterPerPixel * 100 * 39.3701; // 39.3701 inches in a meter

    return Math.round(scale)
}


export function addLefletControls(mapView) {
    const hidedLeafletControlsPosition = 'topright';

    //CONTROL HOME
    mapView.control_home = window.L.control.defaultExtent({
        position: hidedLeafletControlsPosition
    });
    mapView.control_home.addTo(mapView);


    //CONTROL MEASURES
    //https://github.com/ptma/Leaflet.Measure
    //Traducciones   
    window.L.Measure = {
        linearMeasurement: "Mediciónd e longitud",
        areaMeasurement: "Medición de área",
        start: "Inicio de medición",
        meter: "Metros",
        kilometer: "kilómetros",
        kilometerDecimals: 2,
        squareMeter: "Metros cuadrados",
        squareMeterDecimals: 0,
        squareKilometers: "Kilómetros cuadrados",
        squareKilometersDecimals: 2
    };
    //Opciones
    let measureOptions = {
        position: hidedLeafletControlsPosition,
        title: 'Medir',
        color: '#05f9f9'
    };
    mapView.control_measures = window.L.control.measure(measureOptions);
    mapView.control_measures.addTo(mapView);
    window.map.control_measures = mapView.control_measures;

    //CONTROL LOCATION
    mapView.control_location = window.L.control.locate({
        position: hidedLeafletControlsPosition,
        strings: {
            title: "Localización"
        }
    });
    mapView.control_location.addTo(mapView);

    //CONTROL SCALEBAR   
    mapView.control_scalebar = window.L.control.betterscale({ position: "bottomleft", metric: true, imperial: false });
    mapView.control_scalebar.addTo(mapView);


}


export const toolStreetViewOnMousedown = (mapView, e) => {

    mapView.graphicsLayer.clearLayers();

    //Deshabilita el fdrad del mapa
    mapView.dragging.disable();

    // Your logic for handling the click event when the STREETVIEW tool is selected
    const icon = window.L.divIcon({
        className: 'custom-icon',
        html: '<i class="fg-north-arrow" style="color: lightred; background-color: red; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 50%;"></i>',
        iconSize: [32, 32],
        iconAnchor: [16, 16] // Center the icon horizontally and vertically
    });
    window.L.marker(e.latlng, { icon: icon }).addTo(mapView.graphicsLayer);

}

export const toolStreetViewOnMouseMove = (mapView, e) => {

    // Calculate the orientation between mapView.mousedown_event.latlng and mapView.mousemove_event.latlng
    if (mapView.mousedown_event && mapView.mousedown_event.latlng) {
        mapView.graphicsLayer.clearLayers();

        // Calculate the angle between the two points
        const startLatLng = mapView.mousedown_event.latlng;
        const endLatLng = e.latlng;

        const deltaX = endLatLng.lng - startLatLng.lng;
        const deltaY = endLatLng.lat - startLatLng.lat;

        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Convert radians to degrees

        angle = -(angle - 90); // Adjust the angle to point north
        // Your logic for handling the mouse move event when the STREETVIEW tool is selected
        const icon = window.L.divIcon({
            className: 'custom-icon',
            html: `<i class="fg-north-arrow" style="color: lightred; background-color: red; display: flex; align-items: center; justify-content: center; height: 100%; border-radius: 50%; transform: rotate(${angle}deg);"></i>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16] // Center the icon horizontally and
        });

        window.L.marker(mapView.mousedown_event.latlng, { icon: icon }).addTo(mapView.graphicsLayer);
    }

}

export const toolStreetViewOnMouseUp = (mapView, e) => {
    //Habilita el fdrad del mapa
    mapView.dragging.enable();

    mapView.graphicsLayer.clearLayers();

    // Calculate the orientation between mapView.mousedown_event.latlng and mapView.mousemove_event.latlng
    if (mapView.mousedown_event) {
        mapView.graphicsLayer.clearLayers();

        // Calculate the angle between the two points
        const startLatLng = mapView.mousedown_event.latlng;
        const endLatLng = e.latlng;

        const deltaX = endLatLng.lng - startLatLng.lng;
        const deltaY = endLatLng.lat - startLatLng.lat;

        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Convert radians to degrees

        angle = -(angle - 90); // Adjust the angle to point north

        // Create a URL to open a Google Street View with the given parameters
        const lat = startLatLng.lat;
        const lng = startLatLng.lng;
        const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${angle}`;


        //Reseteo de eventos
        mapView.mousedown_event.latlng = null;
        mapView.mousemove_event.latlng = null;
        mapView.mouseup_event.latlng = null;

        // Open the URL in a new tab
        window.open(googleStreetViewUrl, '_blank');

    }

}
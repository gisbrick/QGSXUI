import { createContext, useState } from "react";

export const MapViewContext = createContext()

export const MapViewProvider = ({ children }) => {

    const [mapView, setMapView] = useState(null)
    const [layers, setLayers] = useState([]) // [{layerName, layerObject}]
    //const [markers , setMarkers] = useState(null)

    const addLayerToMapView = (layerName, visible, layerObject) => {
        
        setLayers(prevLayers => {
            if (prevLayers.some(layer => layer.layerName === layerName)) {
                prevLayers = deleteLayerFromMapView(layerName, prevLayers)
            }

            const newLayer = { layerName, layerObject };
            if(visible){
                layerObject.addTo(mapView);
            }
            
           
            return [...prevLayers, newLayer];
        });

    }

    const deleteLayerFromMapView = (theLayerName, prevLayers) => {
        const layer = prevLayers.find((ly) => ly.layerName == theLayerName)
        if (!layer) {
            return prevLayers
        }
        mapView.removeLayer(layer.layerObject)
        const currentLayers = prevLayers.filter((ly) => ly.layerName != layer.layerName)
        return [...currentLayers]

    }
    /*
    const addMarkersToMapView = (theMarkers) => {
        //console.log("param", theMarkers, markers)
        if(markers) {
            setMarkers(prevMarkers => {
                //console.log("aaaquiiii", theMarkers, pre)
                prevMarkers.clearLayers();
                return theMarkers
            })
        } else {
            //console.log(theMarkers)
            setMarkers(theMarkers)
        }
        theMarkers.addTo(mapView)
    }*/

    return (
        <MapViewContext.Provider value={{
            mapView,
            setMapView,
            addLayerToMapView,
            deleteLayerFromMapView,
            //markers,
            //addMarkersToMapView
        }}>
            {children}
        </MapViewContext.Provider>
    )

}
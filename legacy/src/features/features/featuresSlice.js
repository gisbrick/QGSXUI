import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

export const featuresSlice = createSlice({
    name: "features",
    initialState: initialState,
    reducers: {
        /**
         * Esta función annade una layer con sus features al estado general.
         * Esto se hace cuando se renderiza el componente Form.
         * La feature se annade solo cuando no existe already.
         * El campo modified es el más importante e indica si los campos de una feature han sido modificados o no,
         * por consiguiente su layer tambien ha sido modificada.
         * 
         * @param {*} state 
         * @param {*} param1 
         */
        addFeatures: (state, { payload }) => {
            let objectLayer = {
                layer: undefined,
                modified: false,
                features: []
            }
            let objectFeature = {
                id: undefined,
                modified: false,
                properties: {}
            }
            let nameLayer = payload.id.split(".")[0].replaceAll(" ", "_")
            let idFeature = payload.id.split(".")[1]
            let layer = state.find((capa) => capa.layer == nameLayer)
            //console.log("existeLayer", layer)
            if (layer == undefined) {
                //se introduce la layer y la feature
                objectLayer.layer = nameLayer

                objectFeature.id = idFeature
                objectFeature.properties = payload.properties;

                objectLayer.features.push(objectFeature)
                state.push(objectLayer)

            } else {
                let feature = layer.features.find((feature) => feature.id == idFeature)
                if (feature == undefined) {
                    //se introduce la feature

                    objectFeature.id = idFeature
                    objectFeature.properties = payload.properties;
                    layer.features.push(objectFeature)

                }
            }
        },
        /**
         * Funcion que modifica los campos modified a true y annade las propiedades modificadas a la feature
         * 
         * @param {*} state 
         * @param {*} param1 
         */
        modifiedFeatures: (state, { payload }) => {
            
            if (payload.field && payload.feature && payload.value) {
                let nameLayer = null;
                let idFeature = null;
                //console.log("payload modified", payload)
                let fieldName = payload?.field?.name
                //console.log("fieldName", fieldName)
                let value = payload?.value
                //console.log("value", value)
                if(payload?.feature?.id) {
                    nameLayer = payload.feature.id.split(".")[0].replaceAll(" ", "_")
                    //console.log("nameLayer", nameLayer)
                    idFeature = payload.feature.id.split(".")[1]
                    //console.log("idFeature", idFeature)
                } else if(payload?.feature?.name) {
                    nameLayer = payload.feature.name
                    //console.log("nameLayer", nameLayer)
                    //console.log("idFeature", idFeature)
                }else {
                    console.log("error en featureSlice")
                    //console.log("nameLayer", nameLayer)
                    //console.log("idFeature", idFeature)
                }


                const modifiedLayer = (layer, fieldName, value) => {
                    layer.modified = true
                    layer.features.map((feature) => feature.id == idFeature
                        ? modificatorFeature(feature, fieldName, value)
                        : feature)
                    return layer
                }

                const modificatorFeature = (feature, fieldName, value) => {
                    feature.modified = true;
                    feature.properties[fieldName] = value
                    return feature
                }
                //let feature = state.find((layer) => layer.layer == nameLayer).features.find((feature) => feature.id == idFeature)
                state.map((layer) => layer.layer == nameLayer
                    ? modifiedLayer(layer, fieldName, value)
                    : layer)
                //console.log("feature", feature)

            }

        },
        modifiedFeaturesRelation: (state, { payload }) => {
            let nameLayer = null
            if (payload) {
                nameLayer = payload.id.split(".")[0].replaceAll(" ", "_")
            }
            const modifiedLayer = (layer) => {
                layer.modified = true
                return layer
            }
            state.map((layer) => layer.layer == nameLayer
            ? modifiedLayer(layer)
            : layer)
        },
        /**
         * Función que cambia el valor del campo modified de la feature a false.
         * Si la layer no contiene ninguna feture modificada entonces el valor de su campo modified pasa a ser false.
         * 
         * @param {*} state 
         * @param {*} param1 
         */
        removeFeature: (state, { payload }) => {
            //console.log("payload", payload)
            let nameLayer = payload.id.split(".")[0].replaceAll(" ", "_")
            let idFeature = payload.id.split(".")[1]
            state.map((layer) =>
                layer.layer == nameLayer
                    ? layer.features.map((feature) => feature.id == idFeature
                        ? feature.modified = false
                        : feature)
                    : layer)

            state.map((layer) =>
                layer.layer == nameLayer
                    ? layer.features.filter((feature) => feature.modified == true).length == 0
                        ? layer.modified = false
                        : layer
                    : layer)

            //console.log("state", state)
        },
        /**
         * Función que resetea el estado a [] cuando se cierra modal
         * 
         * @param {*} state 
         * @returns 
         */
        resetFeatures: (state) => initialState
    }
});

export const { addFeatures, modifiedFeatures, modifiedFeaturesRelation, resetFeatures, removeFeature } = featuresSlice.actions;

export const features_state = (state) => state.features;

export default featuresSlice.reducer;


import { Card, Form } from "antd";
import { useState, useEffect } from "react";
import FormEditComponent from "../../../form/formEditComponent";
import { getDefaultProperties } from "../../../../utilities/mapUtils";
import i18next from "i18next";

const PersonalDataInhu = ({ QGISPRJ, qgisLayer, map, feature: featureAux, editable, mapView, properties, 
    setProperties, form }) => {

    const isNewFeature = featureAux == null || featureAux == undefined || featureAux.id == null || featureAux.id == undefined;

    const [feature, setFeature] = useState(false);
    const [fieldsChanged, setFieldsChanged] = useState(false);

    useEffect(() => {
        console.log("properties", properties)
        if (!featureAux || !featureAux.id) {
            reloadForm();
        }

    }, [featureAux])


    const reloadForm = async () => {
        let propsAux = {}

        let defaultProperties = await getDefaultProperties(qgisLayer, null, isNewFeature)
            .then((response) => {
                return response
            })
            .catch((error) => console.log("error", error))

        for (let key in defaultProperties) {
            propsAux[key] = defaultProperties[key];
        }

        if(JSON.stringify(properties) !== "{}") {
            propsAux = properties
        }

        setProperties(propsAux)
        setFeature({ ...featureAux })
        form.setFieldsValue(propsAux);
    }

    return (
        <>
            <Card
                size="small"
            >
                <Form
                    layout={"vertical"}
                    disabled={!editable}
                    onFieldsChange={(field, allFields) => {
                        //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
                        if (field.length > 0) properties[field[0].name[0]] = field[0].value;
                        //console.log("properties", properties)
                        setProperties(properties)
                        
                        setFieldsChanged(true);
                        //setHabilitarBotonGuardar(true)
                    }}
                    form={form}>

                    {properties && <>
                        <FormEditComponent QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} map={map} setFieldsChanged={setFieldsChanged}
                            form={form} editable={editable} feature={feature} properties={properties} mapView={mapView}
                            reload={null}>
                        </FormEditComponent>
                    </>}

                </Form>
            </Card>


        </>
    )
}

export default PersonalDataInhu;
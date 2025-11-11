import QgisTabComponent from "./qgisTabComponent";
import {useEffect} from "react"
const FormEditComponent = ({ QGISPRJ, qgisLayer, map, setFieldsChanged, form, editable, feature, properties, mapView, reload }) => {

    useEffect(() => {
        console.log("feature", feature)
        console.log("properties", properties)
    }, [])
    return (
        <>
            {qgisLayer.editFormConfig.tabs.map((tab, index) => {
                return (
                        <QgisTabComponent
                            key={"QgisTabComponent_" + index} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form}
                            editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView}
                            reload={reload} tab={tab}
                        ></QgisTabComponent>
                )
            })}
        </>
    );

}

export default FormEditComponent;
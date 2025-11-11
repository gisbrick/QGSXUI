import { useEffect, useRef, useState } from "react";
import ListComponent from "../list/listComponent";

const TableResultComponent = ({ tableSize, mapDiv, mapView, layer, QGISPRJ, tablesResult, tourStepsToolbar, setTourStepsToolbar, setTourStepsRow, setLoading}) => {

    const tableRef = useRef(null);

    const [uid, setUid] = useState(false);
    const [featureTable, setFeatureTable] = useState();

    useEffect(() => {
        if (!uid) {
            var uuid = Math.random().toString(36).slice(-6);
            setUid(uuid)
        }
        else {
            /*
            const ft = new FeatureTable({
                view: mapView, // This must be set to enable highlight in the map
                layer: featureLayer,
                hiddenFields: hiddenAttributes,
                highlightEnabled: true,
                container: uid
            });
            setFeatureTable(ft);*/
        }
    }, [uid])


    return (
        < >           
            {/*featureTable && <TableToolbarComponent mapDiv={mapDiv} mapView={mapView} mapLayer={mapLayer} featureLayer={featureLayer} featureTable={featureTable} graphicLayer={graphicLayer}></TableToolbarComponent>}
            {uid &&
            <div id={uid} style={{ height: tableSize  - 130}} ref={tableRef}></div>*/}




            <ListComponent height={tableSize - 250} map={QGISPRJ.mapRef} layer={layer} mapView={mapView} tablesResult={tablesResult} tourStepsToolbar={tourStepsToolbar} setTourStepsToolbar={setTourStepsToolbar} setTourStepsRow={setTourStepsRow}
            setLoading={setLoading}></ListComponent>

            {/* 
             <ListComponent map={QGISPRJ.mapRef} layer={layer} mapView={mapView}></ListComponent>*/}
        </>
    )
};
export default TableResultComponent;
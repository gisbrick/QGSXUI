import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Checkbox, Space, Tooltip } from "antd";
import i18next, { use } from "i18next";


const RowActionButtonsComponent = ({ map, QGISPRJ, layer, qgisLayer, reload, mapView, index, feature, tableActions, selection, rowIndex }) => {



    return (
        <>
            <Space wrap>
                <Checkbox checked={selection.includes(feature.id)} onChange={(e) => { tableActions.select(feature, e.target.checked); e.stopPropagation() }} />
                {qgisLayer.WFSCapabilities.allowDelete &&
                    <Tooltip title={i18next.t('common.actions.view.name')}>
                        <Button size='small' 
                        onClick={() => {
                            tableActions.view(feature)
                        }}
                            type={"default"} shape="circle">
                            <EyeOutlined />
                        </Button>
                    </Tooltip>}
                {qgisLayer.WFSCapabilities.allowUpdate &&
                    <Tooltip title={i18next.t('common.actions.edit.name')}>
                        <Button size='small' onClick={() => tableActions.update(feature)}
                            type={"default"} shape="circle">
                            <EditOutlined />
                        </Button>
                    </Tooltip>}
                {qgisLayer.WFSCapabilities.allowDelete &&
                    <Tooltip title={i18next.t('common.actions.delete.name')}>
                        <Button size='small' onClick={() => tableActions.delete(feature)}
                            type={"default"} shape="circle">
                            <DeleteOutlined />
                        </Button>
                    </Tooltip>}
            </Space>
        </>
    )
};

export default RowActionButtonsComponent;

//Calculamos la anchura de las acciones para la tabla
export function getRowActionMenuComponentWidth(qgisLayer) {
    let out = 50; //Anchura mínima por defecto
    let btWith = 40;
    if (qgisLayer.WFSCapabilities.allowQuery) out = out + btWith;
    //if (qgisLayer.WFSCapabilities.allowInsert) out = out + btWith;
    if (qgisLayer.WFSCapabilities.allowUpdate) out = out + btWith;
    if (qgisLayer.WFSCapabilities.allowDelete) out = out + btWith;
    return out;

}
import { Button, Tooltip } from "antd"

const ToolCatalogoPiezas = () => {
    return (
        <Tooltip title={"Lista de piezas destacadas"}>
            <Button type="primary" shape="circle" size='large'
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                href='#/catalogoPiezas' target="_blank">
                {<i className="fa fa-star"></i>}
            </Button>
        </Tooltip>
    )
}

export default ToolCatalogoPiezas
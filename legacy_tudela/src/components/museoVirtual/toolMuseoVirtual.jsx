import { Button, Tooltip } from "antd"

const ToolMuseoVirtual = () => {

    return (
        <Tooltip title={"Museo Virtual"}>
            <Button type="primary" shape="circle" size='large'
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                href='#/museoVirtual' target="_blank">
                {<i class="fa-solid fa-landmark"></i>}
            </Button>
        </Tooltip>
    )

}

export default ToolMuseoVirtual
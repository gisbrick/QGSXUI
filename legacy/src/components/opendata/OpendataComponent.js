
import { useEffect } from "react";
import { QgisService } from "../../service/qgisService";
import { useState } from "react";
import { Button, Card, Col, Empty, Layout, Row, Space, Spin, Table, Tooltip, Typography } from "antd";
import { Content } from "antd/es/layout/layout";
import LoadingComponent from "../utils/LoadingComponent";
import SplitPane, { Pane } from "react-split-pane";
import { CheckOutlined, DownloadOutlined } from "@ant-design/icons";
import i18next from "i18next";
import { Reactor } from "../../utilities/EventsUtilities";
import { ServicesConfig } from "../../service/servicesConfig";
const { Text, Link } = Typography;

function OpendataComponent({ map, layer, mapView }) {

    const [QGISPRJ, setQGISPRJ] = useState();
    const [qgisLayer, setQgisLayer] = useState();

    let props = {}
    props["CRS"] = "EPSG:25830" //TODO Sacar de un properties o del proyecto... 
    props["SERVICE"] = "WFS"
    props["REQUEST"] = "GetFeature"
    props["VERSION"] = "1.3.0"


    const download = (format) => {
        props["TYPENAME"] = qgisLayer.name.replaceAll(" ", "_")
        props["OUTPUTFORMAT"] = format
        let urlParams = "";
        for (let key in props) {
            urlParams = urlParams + "&" + key + "=" + props[key]
        }
        //OJO, no se descarga si son servicios privados... es opendata

        let url = ServicesConfig.getBaseUrl() + "/qgis?MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + encodeURI(urlParams) //"&"+ new URLSearchParams(printProps).toString()
        window.open(url, '_blank');
    }

    const getQgisLayer = (prj) => {
        if (layer in prj.layers) {
            var qgislayerCopy = prj.layers[layer];
            setQgisLayer(qgislayerCopy)
        }
    }

    useEffect(() => {
        QgisService.QGISPRJ(map)
            .then((data) => {
                setQGISPRJ(data);
                getQgisLayer(data)

            })
            .catch(err => {
                console.log("ERROR", err);
            })
    }, [])

    //ICONOS
    //https://icons8.com/icon/10238/xml
    return (
        <>
            {qgisLayer && <Card
                size="small"
                title={i18next.t('common.tools.opendata.table', { 'table': qgisLayer.name })}
                bordered={true}
                style={{ margin: "5px" }}>

                <Row style={{ width: "100%", paddingRight: "20px" }}>
                    <Col flex="auto">
                        <Space>
                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACZklEQVR4nO2Yy6vNURTHP/IeIEmhRHmM5DFQREpJMUCZkDwmBhh5lETKQBl6DEzUDV3KyETyFyiu4pbHwEy5RN0IXZx7l1Z9T+1Ov3PvuXX33r/f8Vu1Ov3Wd51z1mevvdfvdw7UVi2zSP4GWNANIJYaxroFxiL6K732A/OrDDIX6EvVGYvopISxyCDJYCwBSBIYSwQSHcYSgkSFSQ0SDSYHSBSYXCATDmMl8v5uAbEahPwdsLojLZa7A1Z3pMX+m440gCvAcmAqsC7Q/gKXgZXATGk/gKv67MNB7jvFFucCOag8/6m6GzgWaOelOcheYL3izxRfG+Q+UGxfDpBHQaGfCvR5wELgV0v8jzo0Dfit2AV91o0cIL7Kbj0Fmhc4GVgGjBToW/Tel7repesXOUAWKedDG32r9BPByjf9rLTbul4KzNK5SgoyohWfogNflPNW28ttI/Ax0B4qfhr4BkwCtuWYWr5yaFINj5L3HlitXH8dUvyzit8BPJd+MQeI+2zlDIyR910dcbsfxH1kLwHuSnuSC2RzQXHtvFe5l4LYIXXlpLapb7EsINeUswr4UqA3Cg73vSB2UzE/6Gs6gDCN7AkHGVIBzRui7/cj0n5qqu3R9PKVX6F4+N9v0453CNITA8T9K3BUINNVtGlCbdJI9ZvigYIx3QjOWe8o3zGo+8ygrs/FAIntw8BO1bJd8D7691cN5FRLPWcU98eeDVUBudOmplvSBzS+Sw3SpwfLIpsBPFXea2BOmUEs8LHqeaxHpcqDGHC9qiDjttwQ1qaeGsTqjlBvLavPSMnMOpxkpbdxgfwD43uIikos+GEAAAAASUVORK5CYII=" />
                            <Text type="success" >{i18next.t('common.tools.opendata.format', { 'table': qgisLayer.name, 'format': 'CSV' })}</Text>
                        </Space>
                    </Col>
                    <Col flex="130px" style={{ textAlign: "right" }}>
                        <Button type="primary" onClick={(e) => download('CSV')}>
                            <Space>
                                <DownloadOutlined />
                                {i18next.t('common.tools.download.name')}
                            </Space>
                        </Button>
                    </Col>
                </Row>

                <Row style={{ width: "100%", paddingRight: "20px" }}>
                    <Col flex="auto">
                        <Space>
                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACv0lEQVR4nO2a24vNURTHP8O4RhmXkpQnTEmSSzxSHpCSS3mZIkUoeVHzB8iDpMahiJQolLxMLqVolAfFg1GiEBEi91tqnK2t76nVds6ZMzq/vX+j36rV7+y11u/X+uy1f2vvczpQXVyGeh+YTCRx/wuMy1Dv6toLTBrMIG3A7ViVcRkqMWFcxiDRYFwEkCgwLhJI5jAuIkimMC4ySGYwLgFIJjCpQJoOkxKkqTCpQZoGkwcQdBbr1X3+miuQWJPwR1In7AqQQFLPvCsqEkjqmXdFRQJJPfOuqEgg9WZlC7DHjN8DO4DZ0lIQfwVYDiwBzgS+o8B64FXw/EMxKuJlnj73AQtkGwW0KpFK7EVgiM5N4xR32vi3yrYveP6q2CA9Gq8V1FfguXxloB0YCbwAngHDgGnArwCkPTXIKY0PVIm7J98GY1sp250AxMvNlCAPtXTmAO+CuPOK3W9snbKdC0DGAJtTgtjkZgisYi8FSXvtkq0rAOkAxmppDk8FUlYXawHGAw9k36vYCybWdyNM16uAXNX1hKqTBMS2Ui9LNT6m8UkTU4E7GIC8BBYCi4AJdUAGDNTfQxbX8M1XZb4D3cHse90mW3cVkCP63BoD5LP8G2v45wIjgJ/a5FpMhfwSnAUMBV5XAfkIjNbYglTL659BPMA1za7tRH5t79aO7Xf3yp4SttuSWVZrjN+C+HFH1iC3jG8m8EF2vyNbWQa8Mfc9AaYa/3SzYVYDuZ41yFu9tJfVIq3vqar1qM5yPAtc0rtjfTfUJL6Z5Xdc57NMQFKqlQLEFRUh06XlAq2cGP6SwQTSo/NZLkE6qS87FfcYmFgv0OVAd9XIbYW+xH3SSaGuuBxoGdgU5OWPQF8E4n8H6FdcTrQPWKecpphTwfZGIPIE4oAfwGrzH5bDjULkDcQ12qEGE0jbQCDyDFJTfgMkORGWtYM1UAAAAABJRU5ErkJggg==" />
                            <Text type="success" >{i18next.t('common.tools.opendata.format', { 'table': qgisLayer.name, 'format': 'JSON' })}</Text>
                        </Space>
                    </Col>
                    <Col flex="130px" style={{ textAlign: "right" }}>
                        <Button type="primary" onClick={(e) => download('GEOJSON')}>
                            <Space>
                                <DownloadOutlined />
                                {i18next.t('common.tools.download.name')}
                            </Space>
                        </Button>
                    </Col>
                </Row>
                <Row style={{ width: "100%", paddingRight: "20px" }}>
                    <Col flex="auto">
                        <Space>
                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB7UlEQVR4nO2ZMUjVURTGf4VGIVlGi0lDEBiB4NCgS4Ek5KQEQS8MG4KWhhxqaAhaHAKHEoQwqqEtXNwaHNydWoooEIxI/0NFBKHBiQsfcbmLTwjOLc4Hh/893z33cr/z3f+D9x4EAoHd4grQAFZpNECrHSE1izDFZjtC7B+JHeF9QAshBbw7beFIAe9OWzhSwLvTFo4U8O60hSMFvDtt4UiBdjuyAXwAvilvlH9XpPGnrP6HuI/Kt5SvezvySPU3lJ9T/gZY0PhkVj8v7rTyt8oHvYU0wD6gV66k8bDmHmivPfrukLhr4vpqE2LAuNbc1/Ox+DvZfkvi+pV31ShkUWsOAgeAr+KvA0eBbuAu8EXunFD9dm1CfgKHtK6V8Rd16PTejAIrwF5gUrVNbUI+Ax1adyHjzwIDwC3gCPAQOAVMq/Z9bUJms0+n1PE18UnEEPBC8yPAlK5ZwmptQgaBHuCJ1t4Tfww4L2Ho/Ug1M8qXaxLyWvWXdOc7gePAL2A/MKG6xCW8A+Y0XsyEHNYeKV55CLmt+mfKx5S/1POq+JvAGY2fa+5pJiTHvNfV8owd4X1ACyEFvDtt4UgB705bOFLAu9MWjhTw7rSFIwW8O23hSIH/xpGmgkPa3/h7upX9FlVjbAKX2xESCAT4g98GXGdEH2gf1AAAAABJRU5ErkJggg==" />
                            <Text type="success" >{i18next.t('common.tools.opendata.format', { 'table': qgisLayer.name, 'format': 'XML' })}</Text>
                        </Space>
                    </Col>
                    <Col flex="130px" style={{ textAlign: "right" }}>
                        <Button type="primary" onClick={(e) => download('KML')}>
                            <Space>
                                <DownloadOutlined />
                                {i18next.t('common.tools.download.name')}
                            </Space>
                        </Button>
                    </Col>
                </Row>
                {qgisLayer.has_geometry && <Row style={{ width: "100%", paddingRight: "20px" }}>
                    <Col flex="auto">
                        <Space>
                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACAklEQVR4nO2YMUiWQRzGf5FCmJlmGqQgRVOTDY0uTkFDS466Fw66NTSEg7QE0RJtgSTS1KCLmkhLqYhaaCKoNFRbUYpDEP84eF54OawPDb+7k3vg4L275+B+3/Pde/ceZKUlO6LyEqg9DiAGjAOnUgbZAD7oeaJaMHYEZQ5oAVZUnwXqUwVxagIW1PYGOEOiIE6NwLzaHdS5VEEKmDn1LQLNqYI4nQXeqX9JayhJkALmrTwfgYupgjid1lvM+daB9lRBCpgZebeByyQK4lQHvJb/E3CFREEKmGmN+QpcJVEQP5kvRAbyP+XQCj1xyyCeQidgORFPoROwnIing/5iW8Bj4D4wUjrNPiztB66sAU+AodKpN5pEnnk3I9fU/lT1QdXHPN/dmEDmgZOa4ANdKkz9BaQNqAFG9Ym7GBNIr/z39ukrg+zp+TzwK8bFfkn+hQogpr+cUzfwOTaQOvndKfVOafz2PiDuTuuC2lqB5ZhAGuXfBF4AHf8AKU6yXd5LIQqQ6/K/Uv1WBRDTemlQ304sIMPyO6DvFUDeA7+BVV2XNseUyC7QqTG1pX3CB/kBnNCrutCjmEAM+Kkd/DZwExhQ2yTQAzwHvgH9wA2gTzfyFhuIVaEcWqEnbhnEU+gELCfiKXQClhPxFDoBy4l4Cp2A5UQ8hU7AciKejk0iWVRZfwBmC3h3qoEyOQAAAABJRU5ErkJggg==" />
                            <Text type="success" >{i18next.t('common.tools.opendata.format', { 'table': qgisLayer.name, 'format': 'SHP' })}</Text>
                        </Space>
                    </Col>
                    <Col flex="130px" style={{ textAlign: "right" }}>
                        <Button type="primary" onClick={(e) => download('SHP')}>
                            <Space>
                                <DownloadOutlined />
                                {i18next.t('common.tools.download.name')}
                            </Space>
                        </Button>
                    </Col>
                </Row>
                }
            </Card>}
            {!qgisLayer && <Spin className="ant-spin-centered" />}
        </>
    );
}

export default OpendataComponent;

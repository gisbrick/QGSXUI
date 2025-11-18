import { useContext, useEffect, useState } from "react"
import { ConfigMapContext } from "../../context/configMapProvider";
import { Card, Col, Row, Space } from "antd";

const ListPiezas = () => {

    const { dataPath } = useContext(ConfigMapContext)
    const [dataFotogrametria, setDataFotogrametria] = useState([])

    const listLayerName = "Intervenciones";
    const listFotogrametria = "Fotogrametría"
    const piezasDestacadas = "Piezas destacadas"

    const getIntervenciones = async () => {
        const response = await fetch(`${dataPath}/${listLayerName}.geojson`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getFotogrametria = async () => {
        const response = await fetch(`${dataPath}/${listFotogrametria}.geojson`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getPiezas = async () => {
        const response = await fetch(`${dataPath}/${piezasDestacadas}.geojson`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const mount = async () => {
        await Promise.all([getIntervenciones(), getFotogrametria(), getPiezas()])
            .then((values) => {
                const intervenciones = values[0]
                const fotogrametría = values[1]
                const piezasDestacadas = values[2]
                const arrayGlobal = []
                if (fotogrametría.features.length > 0) {
                    const array = fotogrametría.features.filter((item) => item.properties.enlace_3D).map((item) => {
                        const idIntervencion = item.properties.numero_int
                        const nameIntervencion = intervenciones.features.find((intervencion) => intervencion.properties.numero_int == idIntervencion).properties.denominacion
                        let urlPiez3DEmbebida = null;
                        const match = item.properties.enlace_3D.match(/\/3d-models\/.*-(\w+)$/);
                        if (match && match[1]) {
                            urlPiez3DEmbebida = `https://sketchfab.com/models/${match[1]}/embed`;
                        }
                        item.properties["intervencionName"] = nameIntervencion
                        item.properties.nombre = nameIntervencion
                        item.properties.urlPiez3DEmbebida = urlPiez3DEmbebida
                        item.properties.url = `#/ficha/intervenciones/${item.properties.numero_int}`
                        item.properties.descripcion = item.properties.observaciones
                        return item.properties
                    })
                    arrayGlobal.push(...array)
                }
                if (piezasDestacadas.features.length > 0) {
                    const array = piezasDestacadas.features.filter((item) => item.properties.enlace_3D).map((item) => {
                        const idIntervencion = item.properties.numero_int
                        const nameIntervencion = intervenciones.features.find((intervencion) => intervencion.properties.numero_int == idIntervencion).properties.denominacion
                        let urlPiez3DEmbebida = null;
                        if (item.properties.enlace_3D) {
                            const match = item.properties.enlace_3D.match(/\/3d-models\/.*-(\w+)$/);
                            if (match && match[1]) {
                                urlPiez3DEmbebida = `https://sketchfab.com/models/${match[1]}/embed`;
                            }
                        }
                        item.properties.nombre = item.properties.morfologia
                        item.properties.url = `#/fichaPiezaDestacada/${item.properties.num_pieza}`
                        item.properties["intervencionName"] = nameIntervencion
                        item.properties.urlPiez3DEmbebida = urlPiez3DEmbebida
                        return item.properties
                    })
                    arrayGlobal.push(...array)
                }
                setDataFotogrametria(arrayGlobal)
            })
            .catch((error) => {
                console.log("error ", error)
            })
    }

    useEffect(() => {
        if (dataPath) {
            mount()
        }
    }, [dataPath])

    return (
        dataFotogrametria.length > 0 ? (
            <Row gutter={[16, 16]}>
                {dataFotogrametria.map((item, index) => (
                    <Col key={index} xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title={item.nombre}
                            styles={{ header: { background: "#c2e9fb" } }}
                        >
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <div><span style={{ fontWeight: "bold" }}>Intervención: </span><span>{item.intervencionName}</span></div>
                                <div><span style={{ fontWeight: "bold" }}>Modelo 3D: <a href={item.enlace_3D} target='_blank'>Abrir enlace</a></span></div>
                                {/*let url = `<a href="#/ficha/${name}/${feature.properties.numero_int}" target="_blank">Abrir ficha</a>`; */}
                                {/*let url = `<a href="#/fichaPiezaDestacada/${pieza.properties.num_pieza}" target="_blank">Abrir ficha</a>`; */}
                                <div><span style={{ fontWeight: "bold" }}>Ficha: <a href={item.url} target='_blank'>Abrir ficha</a></span></div>
                                <div><span style={{ fontWeight: "bold" }}>Descripción: </span><span>{item.descripcion}</span></div>
                                {item.urlPiez3DEmbebida && <>
                                    <div class="sketchfab-embed-wrapper" style={{ width: '100%', height: '400px' }}>
                                        <iframe title="Cuenco carenado. Cerámica bajomedieval." style={{ width: '100%', height: '100%' }}
                                            frameborder="0"
                                            allowfullscreen mozallowfullscreen="true"
                                            webkitallowfullscreen="true"
                                            allow="autoplay; fullscreen; xr-spatial-tracking"
                                            xr-spatial-tracking execution-while-out-of-viewport
                                            execution-while-not-rendered web-share
                                            src={item.urlPiez3DEmbebida}>
                                        </iframe>
                                    </div>
                                </>
                                }
                            </Space>

                        </Card>
                    </Col>
                ))}
            </Row>
        ) : (
            <div>No hay datos</div>
        )
    );


}

export default ListPiezas
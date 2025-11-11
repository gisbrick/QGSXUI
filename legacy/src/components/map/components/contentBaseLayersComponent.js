import { useState, useEffect } from "react";
import { Card, Popover, Row, Space } from "antd";
import Meta from "antd/es/card/Meta";
import { v4 as uuid } from 'uuid';
import { getBaseLayer, setView } from "../../../utilities/mapUtils";



function ContentBaseLayersComponent({ QGISPRJ, WMTSLAYERS, map, mapView }) {

  let sgvMapListComponentStyle = {
    top: "20px",
    right: "20px",
    left: "20px",
    zIndex: 1
  }


  return (



    <Space direction="vertical" style={sgvMapListComponentStyle}>
      <Space align="start" wrap>
        {
          WMTSLAYERS.layers.map((WMTSLAYER, i) => {
            return <BaseLayerComponent key={"BaseLayerComponent" + i} QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} map={mapView} WMTSLAYER={WMTSLAYER}></BaseLayerComponent>
          })
        }
      </Space>
    </Space>
  );
}

export default ContentBaseLayersComponent;


function BaseLayerComponent({ QGISPRJ, WMTSLAYERS, map, WMTSLAYER }) {

  const [uid, setUid] = useState();

  useEffect(() => {
    setUid(uuid())
  }, [])

  const setBaseMap = async () => {
    map.baseLayer.remove();
    let baseLayer = await getBaseLayer(map, WMTSLAYER);
    console.log(baseLayer)
    baseLayer.addTo(map);
    map.baseLayer = baseLayer;
    map.baseLayer.bringToBack();
  }

  return (
    <Popover content={""} title={WMTSLAYER.name}>
      <Card
        onClick={(e) => setBaseMap()}
        hoverable
        style={{ width: 150 }}
        cover={
          <Row justify="center">
            {uid && <BaseLayerThumbnail QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} WMTSLAYER={WMTSLAYER} uid={uid}></BaseLayerThumbnail>}
          </Row>}>
        <Meta title={""} description={<span className="reader">{WMTSLAYER.name}</span>} />
      </Card>
    </Popover>
  )
}

function BaseLayerThumbnail({ QGISPRJ, WMTSLAYERS, WMTSLAYER, uid }) {

  const style = { with: "100px", height: "100px" }


  // Obtención del CRS EPSG:25830.
  var crs = new window.L.Proj.CRS('EPSG:25830',
    '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs', //http://spatialreference.org/ref/epsg/25830/proj4/
    {
      resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
      //Origen de servicio teselado
      origin:[0,0]
    });

  let initMap = async () => {
    var map = window.L.map("map_" + uid, {
      //crs: crs,
      attributionControl: false,
      zoomControl: false,
      minZoom: 0,
      maxZoom: 20,
      zoom: 9,
      rotate: false,
      rotateControl: false
    });
    
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
        
    setView(map, WMTSLAYERS.thumbnail.extent);
       
    //Ajustamos un poco el zoom, para acercarnos más al área del mapa (+2)
    map.setZoom(map.getZoom() + 2)

    let baseLayer = await getBaseLayer(map, WMTSLAYER);

 

    if (baseLayer) {
      baseLayer.addTo(map);
    }
  }

  useEffect(() => {
    initMap();
  }, [])

  return (
    <div style={style} id={"map_" + uid}>
    </div>
  )

}

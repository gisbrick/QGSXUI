import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Card, Carousel, Empty, Form, Modal, Row, Space, Spin, Table, Tabs } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DownloadOutlined, FileAddOutlined, SaveOutlined } from "@ant-design/icons";
import { MediaService } from "../../service/mediaService";
import MediaToolbarComponent from "./mediaToolbarComponent";
import Column from "antd/es/table/Column";
import MediaListComponent from "./mediaListComponent";
import MediaCarruselComponent from "./mediaCarruselComponent";
import MediaFormComponentModal from "./mediaFormComponentModal";



const MediaComponent = forwardRef(({ map, media, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible }, ref) => {

  const [data, setData] = useState();
  const [viewInsert, setViewInsert] = useState();

  let loadMediaData = () => {
    MediaService.LISTFEATURE(map, featureAux)
      .then((dataAux) => {
        //console.log("data", dataAux)
        setData([...dataAux]);
      })
      .catch(err => {
        console.log("ERROR", err);
      })
  }

  let insertFile = () => {
    setViewInsert(true)
  }


  useEffect(() => {
    loadMediaData();
  }, [])

  let renderData = () => {
    return <>
      {media && media.capabilities && media.capabilities.allowInsert &&
        <Button type="primary"
          disabled={false} onClick={(e) => insertFile()}>
            <Space>
            <FileAddOutlined />
              {i18next.t('common.actions.media.insert')}
            </Space>
          
        </Button>}
      {data && data.length == 0 && <Empty />}
      {data && data.length > 0 &&
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              label: i18next.t('common.actions.media.title.list'),
              key: '1',
              children: <MediaListComponent loadMediaData={loadMediaData} map={map} media={media} data={data} editable={editableAux}
                feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={loadMediaData} visible={visible} setVisible={setVisible} />,
            },
            {
              label: i18next.t('common.actions.media.title.carousel'),
              key: '2',
              children: <MediaCarruselComponent loadMediaData={loadMediaData} map={map} media={media} data={data} editable={editableAux}
                feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={loadMediaData} visible={visible} setVisible={setVisible} />
            }
          ]}
        />
      }
    </>
  }


  return (
    <>
      {data && renderData()}
      
      {!data && <Spin className="ant-spin-centered" />}


      {viewInsert && <MediaFormComponentModal map={map} editable={editableAux} item={null} media={media}
        feature={featureAux} qgisLayer={qgisLayer} reload={loadMediaData} visible={viewInsert} setVisible={setViewInsert}></MediaFormComponentModal>}

    </>
  );
})

export default MediaComponent


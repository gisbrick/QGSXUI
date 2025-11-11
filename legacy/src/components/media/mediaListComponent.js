import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Card, Carousel, Empty, Form, Modal, Row, Space, Spin, Table, Tabs } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DownloadOutlined, FileAddOutlined, SaveOutlined } from "@ant-design/icons";
import { MediaService } from "../../service/mediaService";
import MediaToolbarComponent from "./mediaToolbarComponent";
import Column from "antd/es/table/Column";



function MediaListComponent({ loadMediaData, map, media, data, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible }) {

  data.forEach(function (row, i) {
    row.index = i;
  });

  const columns = [
    {
      title: '',
      dataIndex: 'index',
      key: 'index',
      render: (index) => <MediaToolbarComponent loadMediaData={loadMediaData} map={map} media={media} item={data[index]} data={data} editable={editableAux}
        feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisible} />,
    },
    {
      title: i18next.t('common.actions.media.name_'),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: i18next.t('common.actions.media.filename'),
      dataIndex: 'filename',
      key: 'namfilenamee'
    },
    {
      title: i18next.t('common.actions.media.date'),
      dataIndex: 'datepublish',
      key: 'datepublish'
    }
  ]

  return (
    <>
      {data && data.length == 0 && <Empty />}
      {data && data.length > 0 && <div style={{ overflow: "auto" }}><Table dataSource={data} columns={columns}>
      </Table></div>}
    </>
  )
}

export default MediaListComponent;
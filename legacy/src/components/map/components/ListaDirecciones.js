import React from 'react';
import { List } from 'antd';


const ListaDirecciones = ({ cities, fijarEntidadMapa, mapView }) => {
  return (<>
    <div style={{  marginTop: "5px",height: '300px', overflow: 'auto' }} onScroll={(e) => {mapView.scrollWheelZoom.disable()}}>
      <List
        dataSource={cities}
        renderItem={(city, index) => (
          <List.Item
            onClick={() => fijarEntidadMapa(city)}
            style={{ cursor: 'pointer', transition: 'background 0.3s', backgroundColor: "#f0f0f0" }}
            onMouseEnter={(e) => {(e.target.style.background = 'white');mapView.scrollWheelZoom.disable()}}
            onMouseLeave={(e) => {(e.target.style.background = '#f0f0f0');mapView.scrollWheelZoom.enable()}}
          >
            {city.name}
          </List.Item>
        )}
      />
    </div>

  </>

  );
};

export default ListaDirecciones;

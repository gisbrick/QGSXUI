import React, { useState } from 'react';

/**
 * Componente que sirve para crear la imagen de las leyendas de las capas WMS
 * @param {*} param0 
 * @returns 
 */
const ImageLegend = ({ url }) => {
  const [dimensions, setDimensions] = useState({ width: null, height: null });

  /**
   * Cuando se carga la imagen se fijan las dimensiones por defecto que tiene
   */
  const handleImageLoad = () => {
    setDimensions({
      width: img.width,
      height: img.height,
    });
  };

  const handleImageError = () => {
    console.log("url", url)
    console.error('Error al cargar la imagen');
  };

  const img = new Image();
  img.src = url;
  img.onload = handleImageLoad;
  img.onerror = handleImageError;


  /**
   * Si la imagen supera una anchura de 160px entonce se recorta a la mitad.
   * (Se puede otros ajustes)
   */
  return (
    <div>
      { dimensions.width && dimensions.height && 
      <><img src={url} alt="Esta es la leyenda." 
      style={{width: dimensions.width > 160 ? dimensions.width/2 : dimensions.width }}/>
        </>
      }
    </div>
  );
};

export default ImageLegend;

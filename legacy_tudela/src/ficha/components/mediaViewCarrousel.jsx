import React, { useEffect, useState, useRef, useContext } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Button, Image, Skeleton, Space, Tooltip, } from "antd";
import { CaretLeftOutlined, CaretRightOutlined, DownloadOutlined } from "@ant-design/icons";
import LoadingComponent from "./loadingComponent";
import { ConfigMapContext } from "../../context/configMapProvider";
import '../fichaIntervencion.css';


const MediaViewCarrousel = ({ files }) => {

  const [imagenes, setImagenes] = useState([])
  const [setting, setSetting] = useState()
  const ref = useRef(null)
  const height = 300;
  const validFormats = ["jpg", "jpeg", "png"]

  /**
   * Función que renderiza las flechas que se usan para mostrar las fotografías
   * 
   * @returns 
   */
  const renderArrows = () => {
    return (
      <div style={{}}>
        <Space>
          <Button
            disabled={false}
            style={{ background: "#DBDBDB" }}
            onClick={() => ref.current.slickPrev()}
          >
            <CaretLeftOutlined />
          </Button>
          <Button
            disabled={false}
            style={{ background: "#DBDBDB" }}
            onClick={() => ref.current.slickNext()}
          >
            <CaretRightOutlined />
          </Button>
        </Space>

      </div>
    );
  };

  /**
   * Función que configura las propiedades del slider.
   */
  const configSettings = () => {
    const settings = {
      dots: false,
      lazyLoad: "ondemand",
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
    };
    setSetting(settings)
  }

  /**
   * Función que monta el carrusel de forma asincrona
   * 
   * @param {*} data 
   * @param {*} feature 
   */
  const mountCarousel = async (theFotos) => {
    let urls = []

    if (theFotos.length > 0) {
      urls = await cargarImagenesDesdeBaseDatos(theFotos)
    }
    generarImagenes(urls)
  }

  /**
   * Función que recupera las imágenes de base de datos en formato base64
   * 
   * @param {*} item 
   */
  const cargarImagenesDesdeBaseDatos = async (items) => {
    let promises = []
    let images = []
    items.forEach(async (element) => {
      //console.log("item", element)
      promises.push(loadImage(element))
    });
    await Promise.all(promises)
      .then((data) => {
        //console.log("datos", data)
        images.push(...data)
      })
    return images

  }

  const generarImagenes = (files) => {
    let dataAux = []
    if (files.length > 0) {
      files.forEach((file) => {
        if (file.path) {
          let imageAux = renderImage(file.path)
          file["image"] = imageAux
          dataAux.push(file)
        }
      })
      setImagenes(dataAux)
      configSettings()
    }
  }


  /**
   * Función que recupera la imagen en código base64 de la base de datos.
   * 
   * @param {*} data 
   * @returns 
   */
  let loadImage = async (data) => {
    //Descargamos solo las imágenes para previsualizar
    let datos = {}
    datos['data'] = data
    datos['path'] = data.url
    return datos
  }

  /**
   * Función que renderiza una imagen en función de los datos del archivo y de los datos recuperados de base de datos
   * 
   * @param {*} item 
   * @returns 
   */
  let renderImage = (url) => {
    return <div>
      <Image
      style={{ "textAlign": "center"}}
      crossOrigin="anonymous"
      /*height={height}   ¡¡¡¡OJO!!!!!  QUITO LA ALTURA DE LA IMAGEN PORQUE LAS ESTÁ DISTORSIONANDO*/ 
      src={url}
      placeholder={<div style={{ "textAlign": "center", "width":"100%" }}>Cargando...</div>}
      />
    </div>
  }

  //TODO - MODIFICAR EL CÓDIGO YA QUE YA NO SE NECESITA ESTE FILTRADO
  const getFilesImages = (files) => {
    const validFiles = files.filter((file) => {
      const nameandformat = file.ruta.split("/")[file.ruta.split("/").length - 1]
      const format = nameandformat.substring(nameandformat.lastIndexOf(".") + 1)
      let permission = true
      return validFormats.includes(format.toLowerCase()) && permission
    }).map((file) => {
      const nameandformat = file.ruta.split("/")[file.ruta.split("/").length - 1]
      const name = nameandformat.split(".")[0].toLowerCase()
      const format = nameandformat.substring(nameandformat.lastIndexOf(".") + 1).toLowerCase()     
      return {
        ...file,
        name,
        format
      }
    })
    return validFiles
  }


  useEffect(() => {
    setImagenes([])
    const i = getFilesImages(files)
    mountCarousel(i)

  }, [files])

  return (

    imagenes.length > 0 &&
    <>
      {<div className="slider-container" style={{width:"350px", display: "inline-block"}}>
        <Slider ref={ref} {...setting}>
          {imagenes.length > 0 ? 
          imagenes.map((item, index) => {
            let key = index
            return <div key={key}>
              {/*<h5 style={{ marginTop: "5px", marginBottom: "5px" }}>
                  <span style={{fontWeight:"normal"}}>{item.data.name}</span>
              </h5>*/}
              {item.image}
            </div>
          }) 
          : <LoadingComponent></LoadingComponent>
          }
        </Slider>
        {imagenes.length > 1 && renderArrows()}
      </div>}
    </>

  );
}

export default MediaViewCarrousel;

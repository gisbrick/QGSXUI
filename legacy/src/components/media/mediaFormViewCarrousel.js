import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Button, Image, Space, Tooltip, } from "antd";
import { CaretLeftOutlined, CaretRightOutlined, DownloadOutlined } from "@ant-design/icons";
import { MediaService } from "../../service/mediaService";
import LoadingComponent from "../utils/LoadingComponent";
import { dateToVisualDateString } from "../../utilities/valueUtils";
import i18next from "i18next";


const MediaFormViewCarrousel = ({ map, feature, height, data, setLoadingImage, qgisLayer, page }) => {

  const [imagenes, setImagenes] = useState([])
  const [setting, setSetting] = useState()
  const [fechasRegistroImagen, setFechasRegistroImagen] = useState([]);
  const ref = useRef(null)

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
      /*
      dots: false,
      fade: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      waitForAnimate: false,*/

      dots: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,


    };

    if (data.length <= 1) {
      settings.infinite = false
      setSetting(settings)
    } else {
      settings.infinite = true
      setSetting(settings)
    }
  }

  /**
   * Función que monta el carrusel de forma asincrona
   * 
   * @param {*} data 
   * @param {*} feature 
   */
  const mountCarousel = async (data, feature) => {
    let base64url = []
    let fechas = []
    if (data.length > 0) {
      console.log("data", data)
      fechas = getFechasDesdeData(data)
      base64url = await cargarImagenesDesdeBaseDatos(data)
    } else {
      base64url = cargarImagenesDesdeFeature(feature)
    }
    setFechasRegistroImagen(fechas)
    generarImagenes(base64url)
  }

  const getFechasDesdeData = (data) => {
    let fechasAux = []

    data.forEach((item) => {
      let fecha = ""
      if (item?.datepublish != "") {
        fecha = item.datepublish
      }
      fechasAux.push(fecha)
    })
    return fechasAux
  }

  /**
   * Función que recupera las imagenes base64 contenidas en la feature.
   * 
   * @param {*} feature 
   * @returns 
   */
  const cargarImagenesDesdeFeature = (feature) => {

    let properties = feature.properties
    let keys = Object.keys(properties)
    let result = keys
      .map((key) => properties[key])
      .filter((property) => typeof property == "string" && property.includes("base64")
        ? true
        : false)
    return result
  }


  /**
   * Función que recupera las imágenes de base de datos en formato base64
   * 
   * @param {*} item 
   */
  const cargarImagenesDesdeBaseDatos = async (items) => {
    let promises = []
    let images = []
    let itemsImage = items.filter((item) => item.mimetype.startsWith("image"))
    itemsImage.forEach(async (element) => {
      promises.push(loadImage(element))
    });
    await Promise.all(promises)
      .then((data) => {
        images.push(...data)
      })

    let dataBase64 = []

    /*if (images.length > 0) {
      images.forEach((image) => {
        let url = "data:" + image.data.mimetype + ";base64," + image.file.base64File;
        dataBase64.push(url)
      })
    }*/

    if (images.length > 0) {
      itemsImage.forEach((element, index) => {
        let image = images[index]
        let url = "data:" + image.data.mimetype + ";base64," + image.file.base64File;
        element["base64"] = url
        dataBase64.push(element)
      });
    }
    console.log("images", dataBase64)
    return dataBase64

  }

  const generarImagenes = (filesWithBase64) => {
    let dataAux = []
    if (filesWithBase64.length > 0) {
      filesWithBase64.forEach((file) => {
        let imageAux = renderImage(file.base64)
        file["image"] = imageAux
        dataAux.push(file)
      })
      setImagenes(dataAux)
      configSettings()
    } else {
      setLoadingImage(false)
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
    await MediaService.BASE64FILE(map, feature, data.uidMedRsc)
      .then((file) => {
        datos['file'] = file
      })
      .catch(err => {
        console.log("ERROR", err);
        return datos = null
      })

    return datos
  }

  /**
   * Función que renderiza una imagen en función de los datos del archivo y de los datos recuperados de base de datos
   * 
   * @param {*} item 
   * @returns 
   */
  let renderImage = (url) => {

    return <>
      <Image
        height={height}
        src={url}
      />
    </>
  }

  let downloadFile = (map, feature, uidMedRsc) => {
    MediaService.DOWNLOAD(map, feature, uidMedRsc);
  }

  useEffect(() => {
    setImagenes([])
    mountCarousel(data, feature)
  }, [data])



  return (

    imagenes.length > 0 ?
      <>
        <div className="slider-container">


          <Slider ref={ref} {...setting}>
            {imagenes.length > 0 ? imagenes.map((item, index) => {
              let key = index
              console.log(key)
              return <div key={key}>
                <h5 /*className={qgisLayer.name + "_" + page}*/>{fechasRegistroImagen.length > 0 ?
                  i18next.t("formView.dates") +
                  dateToVisualDateString(new Date(fechasRegistroImagen[index]))
                  : ""}                        {<Tooltip placement="right" title={i18next.t('common.actions.download.download')} key={"media.download"}>
                    <Button id={"button" + index} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                      onClick={(e) => {                       
                        downloadFile(map, feature, item.uidMedRsc);
                        console.log(item)
                        window.mouseOverButton = false
                      }}
                      type={"default"} shape="circle">
                      <DownloadOutlined />
                    </Button>
                  </Tooltip>
                  }</h5>
                {item.image}
              </div>
            }) : <LoadingComponent></LoadingComponent>
            }
          </Slider>



          {imagenes.length > 1 && renderArrows()}
        </div>
      </>
      :
      <LoadingComponent></LoadingComponent>

  );
}

export default MediaFormViewCarrousel;

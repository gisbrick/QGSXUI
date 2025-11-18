import { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Button, Space } from "antd";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import LoadingComponent from "./loadingComponent";

const FotogrametriaCarrousel = ({ files }) => {

    const ref = useRef(null)
    const height = 400;
    const [setting, setSetting] = useState()



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
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false

        };
        setSetting(settings)
        if (files.length <= 1) {
            settings.infinite = false
            setSetting(settings)
        } else {
            settings.infinite = true
            setSetting(settings)
        }
    }

    useEffect(() => {
        configSettings()
    }, [])

    return (

        files.length > 0 &&
        <>
            {<div className="slider-container" style={{ width: "100%", display: "inline-block" }}>
                <Slider ref={ref} {...setting}>
                    {files.length > 0 ?
                        files.map((item, index) => {
                            let key = index
                            return <div key={key}>
                                <h5 style={{ marginTop: "10px", marginBottom: "10px" }}>
                                    <Space>
                                        <span style={{ fontWeight: "normal" }}>{item.nombre} <a href={item.url} target='_blank'>Abrir enlace</a></span>
                                    </Space>
                                </h5>
                                {item.url && item.urlEmbebido && <>
                                    <div class="sketchfab-embed-wrapper" style={{ width: '100%', height: height + 'px' }}>
                                        <iframe title="Cuenco carenado. Cerámica bajomedieval." style={{ width: '100%', height: '100%' }}
                                            frameborder="0"
                                            allowfullscreen mozallowfullscreen="true"
                                            webkitallowfullscreen="true"
                                            allow="autoplay; fullscreen; xr-spatial-tracking"
                                            xr-spatial-tracking execution-while-out-of-viewport
                                            execution-while-not-rendered web-share
                                            src={item.urlEmbebido}>
                                        </iframe>
                                    </div>
                                    <br />
                                </>
                                }
                            </div>
                        })
                        : <LoadingComponent></LoadingComponent>
                    }
                </Slider>
                {files.length > 1 && renderArrows()}
            </div>}
        </>

    );

}

export default FotogrametriaCarrousel;
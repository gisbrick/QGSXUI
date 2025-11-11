import React, { Fragment, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client';
import PropTypes from 'prop-types'
import { Calendar, Views, DateLocalizer, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
// and, for optional time zone support
import 'moment-timezone'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import i18next from 'i18next'
import { QgisScheduleService } from '../../service/qgisScheduleService'
import { dateToString } from '../../utilities/valueUtils'
import { Input, Modal } from 'antd'
import NotificationComponent from '../utils/NotificationComponent';
//import nb from 'date-fns/locale/nb';
import { QgisService } from '../../service/qgisService';
import ScheduleComponent from './scheduleComponent';
/*
require('globalize/lib/cultures/globalize.culture.en-GB')
require('globalize/lib/cultures/globalize.culture.es')
*/




const ScheduleComponentInit = ({ map, layer }) => {

  const [QGISPRJ, setQGISPRJ] = useState();
  const [qgisLayer, setQgisLayer] = useState();
  const [schedule, setSchedule] = useState();

  const getQgisLayer = (prj) => {
    if (layer in prj.layers) {
      var qgislayerCopy = prj.layers[layer];
      setQgisLayer(qgislayerCopy)

      //Recuperamos información de si puede gestionar schedule
      if (qgislayerCopy && qgislayerCopy.customProperties && qgislayerCopy.customProperties.URBEGIS_LAYER_SCHEDULE_CONFIG) {
        setSchedule({ "layerName": qgislayerCopy.name, "codResourceFieldName": null }) //No es necesario codResourceFieldName, porque almacenamos el nombre del usuario       
      }
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
  }, [layer])



  return (<>
    {QGISPRJ && schedule &&
      <ScheduleComponent map={map} schedule={schedule} QGISPRJ={QGISPRJ}></ScheduleComponent>
    }
  </>)
}

export default ScheduleComponentInit;

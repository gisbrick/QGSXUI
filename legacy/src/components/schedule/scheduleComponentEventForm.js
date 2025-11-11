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
import { dateToString, dateToVisualDateString, dateToVisualDateTimeString, dateToVisualTimeString } from '../../utilities/valueUtils'
import { Button, Input, Modal, Spin } from 'antd'
import NotificationComponent from '../utils/NotificationComponent';
//import nb from 'date-fns/locale/nb';
import ConfirmDeleteEventComponent from './confirmDeleteEventComponent';
/*
require('globalize/lib/cultures/globalize.culture.en-GB')
require('globalize/lib/cultures/globalize.culture.es')
*/




const ScheduleComponentEventForm = ({ map, schedule, editable, feature, QGISPRJ, qgisLayer, scheduleConfig,
  isModalEventOpen, setIsModalEventOpen,
  from, to, resourceId,
  eventStart, eventEnd, eventTitle,
  setEventStart, setEventEnd, setEventTitle,
  reloadData, event, setEvent, codResourceValue }) => {


  const [updating, setUpdating] = useState()
  const [viewDeleteEvent, setViewDeleteEvent] = useState()

  //console.log("scheduleConfig", scheduleConfig)
  //console.log("event", event)

  useEffect(() => {
    if (event) {
      setEventTitle(event.title);
    }
  }, [event]);

  const handleInsert = (e) => {
    let properties = {}
    //TODO ver como gestionamos en el caso de que no sea texto libre
    properties[scheduleConfig.fields.start_time] = dateToString(eventStart)
    properties[scheduleConfig.fields.end_time] = dateToString(eventEnd)
    properties[scheduleConfig.fields.title] = eventTitle
    properties[scheduleConfig.fields.cod_resource] = codResourceValue //TODO ver como gestionamos cuando sea usuario
    properties[scheduleConfig.fields.resource_id] = resourceId //TODO ver como gestionamos cuando admitamos varios recursos en un calendar

    QgisScheduleService.UPDATEFEATURE(map, qgisLayer.name, qgisLayer, null, properties)
      .then(() => {
        reloadDataState()
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="update"></NotificationComponent>
        );
      })
      .catch(err => {
        console.log("ERROR", err);
      });


    handleCancel();
  }

  const handleUpdate = (e) => {
    let properties = {}
    //TODO ver como gestionamos en el caso de que no sea texto libre
    properties[scheduleConfig.fields.start_time] = dateToString(eventStart)
    properties[scheduleConfig.fields.end_time] = dateToString(eventEnd)
    properties[scheduleConfig.fields.title] = eventTitle
    properties[scheduleConfig.fields.cod_resource] = event.feature.properties[scheduleConfig.fields.cod_resource] //TODO ver como gestionamos cuando sea usuario    
    properties[scheduleConfig.fields.resource_id] = event.feature.properties[scheduleConfig.fields.resource_id] //TODO ver como gestionamos cuando admitamos varios recursos en un calendar

    QgisScheduleService.UPDATEFEATURE(map, qgisLayer.name, qgisLayer, event.feature, properties)
      .then(() => {
        reloadDataState()

        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="update"></NotificationComponent>
        );
      })
      .catch(err => {
        console.log("ERROR", err);
      });


    handleCancel();
  }

  const handleDelete = (e) => {
    setViewDeleteEvent(true)
  }

  const reloadDataState = () => {
    reloadData(from, to)
    setEvent(null)
    setEventTitle(null)
  }

  const handleCancel = (e) => {
    setIsModalEventOpen(false);
    setEventStart(null)
    setEventEnd(null)
    setEventTitle(null)
    setEvent(null)
  }

  const renderDuration = () => {
    return <>{i18next.t('common.actions.schedule.duration', { from: dateToVisualTimeString(eventStart), to: dateToVisualTimeString(eventEnd), date: dateToVisualDateString(eventStart) })}</>
  }

  const renderInput = () => {

    if (scheduleConfig.config.messageType == "free") {
      return <><Input value={eventTitle} onChange={(e) => {
        setEventTitle(e.target.value)
      }}></Input>
        <br />{event && event.feature && event.feature.properties[scheduleConfig.fields.cod_resource] && i18next.t('common.actions.schedule.bookedFor', { for: event.feature.properties[scheduleConfig.fields.cod_resource] })}
      </>
    }
    else if (scheduleConfig.config.messageType == "username") {
      if (event && event.feature) {
        return <><br />{i18next.t('common.actions.schedule.bookedFor', { for: event.feature.properties[scheduleConfig.fields.cod_resource] })}</>
      }
      else {
        return <></>
      }

    }
    else {
      return <></>
    }
  }

  const renderButtons = () => {
    let out = [];

    out.push(<Button key="cancel" onClick={handleCancel}>
      {i18next.t('common.actions.cancel.name')}
    </Button>)

    if (event && qgisLayer.WFSCapabilities.allowUpdate && scheduleConfig.config.messageType == "free") {
      out.push(<Button key="submit" type="primary" disabled={updating} onClick={handleUpdate}>
        {i18next.t('common.actions.update.name')}
        {updating && <Spin></Spin>}
      </Button>)
    }
    if (!event && qgisLayer.WFSCapabilities.allowInsert) {
      out.push(<Button key="submit" type="primary" disabled={updating} onClick={handleInsert}>
        {i18next.t('common.actions.saveNew.name')}
        {updating && <Spin></Spin>}
      </Button>)
    }
    if (event && qgisLayer.WFSCapabilities.allowDelete) {
      out.push(<Button key="submit" type="primary" disabled={updating} onClick={handleDelete}>
        {i18next.t('common.actions.delete.name')}
        {updating && <Spin></Spin>}
      </Button>)
    }

    return out;
  }

  return (<>
    <Modal title={i18next.t('common.actions.schedule.event')} open={isModalEventOpen} onCancel={handleCancel}
      footer={renderButtons()}  >
      {renderDuration()}
      {renderInput()}
    </Modal >

    {viewDeleteEvent && <ConfirmDeleteEventComponent map={map} feature={event.feature} layer={qgisLayer.name} qgisLayer={qgisLayer}
      mapView={null} reload={reloadDataState} setVisible={setViewDeleteEvent} setModalOpen={setIsModalEventOpen}>
    </ConfirmDeleteEventComponent>}
  </>)
}

export default ScheduleComponentEventForm;
import React, { Fragment, useState, useCallback, useMemo, useEffect, useRef, cloneElement, Children } from 'react'
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
import { Button, Input, Modal } from 'antd'
import NotificationComponent from '../utils/NotificationComponent';
//import nb from 'date-fns/locale/nb';
import ScheduleComponentEventForm from './scheduleComponentEventForm';
import { useSelector } from 'react-redux';
import { user_state } from '../../features/user/userSlice';
/*
require('globalize/lib/cultures/globalize.culture.en-GB')
require('globalize/lib/cultures/globalize.culture.es')
*/




const ScheduleComponent = ({ map, schedule, editable, feature, QGISPRJ, qgisLayer, mapView, reload, visible, setVisible }) => {

  const userstate = useSelector(user_state);
  const [myEvents, setEvents] = useState()
  //const [isModalTitleOpen, setIsModalTitleOpen] = useState();
  const [isModalEventOpen, setIsModalEventOpen] = useState();
  const [isModalSelectDurationOpen, setIsModalSelectDurationOpen] = useState();

  const [from, setFrom] = useState();
  const [to, setTo] = useState();

  const [eventStart, setEventStart] = useState();
  const [eventEnd, setEventEnd] = useState();
  const [eventTitle, setEventTitle] = useState();


  const [event, setEvent] = useState();
  const [resourceId, setResourceId] = useState();

  const [min, setMin] = useState();
  const [max, setMax] = useState();

  const myCalendar = useRef();

  const today = new Date();

  //List of All Moment.js Timezones 
  //https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a
  moment.tz.setDefault('Europe/Madrid')
  //const localizer = PropTypes.instanceOf(DateLocalizer)//momentLocalizer(moment)
  require('moment/locale/es.js');


  const localizer = momentLocalizer(moment);

  //Recuperamnos el valor del "cod_resource" que queremos gestionar
  let codResourceValue = null
  if (schedule && feature && feature.properties) {
    codResourceValue = feature.properties[schedule.codResourceFieldName]
  }
  //Recuperamos la capa de agenda
  let agendaQgisLayer = QGISPRJ.layers[schedule.layerName]

  //Recuperampos el config del schedule
  let agendaConfig = null
  if (agendaQgisLayer && "URBEGIS_LAYER_SCHEDULE_CONFIG" in agendaQgisLayer.customProperties) {
    agendaConfig = JSON.parse(agendaQgisLayer.customProperties["URBEGIS_LAYER_SCHEDULE_CONFIG"])
  }

  //Recuperampos el config del ownerFilter
  let ownerConfig = null
  if (agendaQgisLayer && "URBEGIS_DATA_OWNER_FILTER" in agendaQgisLayer.customProperties) {
    ownerConfig = JSON.parse(agendaQgisLayer.customProperties["URBEGIS_DATA_OWNER_FILTER"])
  }

  const onRangeChange = useCallback((range) => {
    if (range.start && range.end) {
      reloadData(range.start, range.end)
    }
    else {
      reloadData(range[0], range[range.length - 1])
    }
  }, [])

  const handleOnView = (e) => {

  }

  const reloadData = (f, t) => {
    if (!agendaConfig) return

    var f = new Date(f.getTime());
    var t = new Date(t.getTime());

    f.setDate(f.getDate() - 4)
    t.setDate(t.getDate() + 4)

    setFrom(f)
    setTo(t)

    let expFilter = "\"" + agendaConfig.fields.start_time + "\" > '" + dateToString(f) + "' AND "
      + "\"" + agendaConfig.fields.start_time + "\" < '" + dateToString(t) + "'"

    //Si el filtro es por usuario en vez de por feature, el filtro lo aplicamos en el servidor
    if (codResourceValue) {
      expFilter = expFilter + " AND "
        + "\"" + agendaConfig.fields.cod_resource + "\" = '" + codResourceValue + "'";
    }


    QgisScheduleService.GETFEATURES(map, agendaQgisLayer.name, null, null, expFilter, null, null, null)
      .then((data) => {
        let events = []
        for (let i in data.features) {
          let id = data.features[i].id
          let start = new Date(data.features[i].properties[agendaConfig.fields.start_time])
          let end = new Date(data.features[i].properties[agendaConfig.fields.end_time])
          let resourceId = data.features[i].properties[agendaConfig.fields.resource_id]
          //TODO get title dependiendo de si es usuario o texto libre
          let title = data.features[i].properties[agendaConfig.fields.title]
          let event = {
            id: id,
            feature: data.features[i],
            start: start,
            end: end,
            resourceId: resourceId,
            title: title
          }
          events.push(event)
        }
        setEvents(events)
      })
      .catch(err => {
        console.log("ERROR", err);
      });

  }


  useEffect(() => {
    if (!agendaConfig) return

    //('month'|'week'|'work_week'|'day'|'agenda')
    //Si tenemos recursos, mostramos por defecto la vista del día, independientemente de lo configurado 
    if (agendaConfig.config.defaultView == 'day' || (agendaConfig && agendaConfig.resourceIds && agendaConfig.resourceIds.length > 0)) {
      let dFrom = new Date()
      let dTo = new Date()
      reloadData(dFrom, dTo)
    }
    if (agendaConfig.config.defaultView == 'week' || agendaConfig.config.defaultView == 'work_week') {
      let dFrom = new Date()
      let dTo = new Date()
      dFrom.setDate(dFrom.getDate() - 7)
      dTo.setDate(dTo.getDate() + 7)
      reloadData(dFrom, dTo)
    }
    if (agendaConfig.config.defaultView == 'month' || agendaConfig.config.defaultView == 'agenda') {
      let dFrom = new Date()
      let dTo = new Date()
      dFrom.setDate(dFrom.getDate() - 30)
      dTo.setDate(dTo.getDate() + 30)
      reloadData(dFrom, dTo)
    }

    handleOnView(agendaConfig.config.defaultView)

  }, [schedule]);


  const evalEventConstrains = (start, end) => {
    let out = true;

    //Evaluamos las constrains de weekday
    if (agendaConfig.config.schedule && agendaConfig.config.schedule.special) {
      if (agendaConfig.config.schedule.special.weekday) {
        let weekday = start.getDay()
        if (weekday in agendaConfig.config.schedule.special.weekday) {
          if (!agendaConfig.config.schedule.special.weekday[weekday]) {
            out = false;
            //Informamos de la excepción
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
              <NotificationComponent type="info" text="invalidEvent" description={i18next.t('common.actions.schedule.errors.eventNotAllowedOnWeekDay', { weekday: i18next.t('common.actions.schedule.weekday.' + weekday) })}></NotificationComponent>
            );
            //alert("No se admiten eventos este día")
          }
          else {
            let from = agendaConfig.config.schedule.special.weekday[weekday].from;
            let to = agendaConfig.config.schedule.special.weekday[weekday].to;
            let fromDate = new Date(start.getTime());
            fromDate.setHours(agendaConfig.config.schedule.special.weekday[weekday].from.hours, agendaConfig.config.schedule.special.weekday[weekday].from.minutes, 0);
            let toDate = new Date(end.getTime());
            toDate.setHours(agendaConfig.config.schedule.special.weekday[weekday].to.hours, agendaConfig.config.schedule.special.weekday[weekday].to.minutes, 0);
            if (start < fromDate || end > toDate) {
              out = false;
              //Informamos de la excepción
              const messages = ReactDOM.createRoot(document.getElementById('messages'));
              messages.render(
                <NotificationComponent type="info" text="invalidEvent" description={i18next.t('common.actions.schedule.errors.eventNotAllowedOnWeekDayHour',
                  {
                    weekday: i18next.t('common.actions.schedule.weekday.' + weekday),
                    start: fromDate.getHours().toString().padStart(2, "0") + ":" + fromDate.getMinutes().toString().padStart(2, "0"),
                    end: toDate.getHours().toString().padStart(2, "0") + ":" + toDate.getMinutes().toString().padStart(2, "0")
                  })}></NotificationComponent>
              );
              //alert("No se admiten eventos en esas horas")
            }
          }
        }
      }
    }

    return out;
  }

  const handleSelectSlot = useCallback(

    ({ slots, start, end, resourceId }) => {

      //Si el usuario tiene que seleccionar una duración del evento, no admitimos continuar
      if (agendaConfig.config.eventMinutesDuration && agendaConfig.config.eventMinutesDuration.length && agendaConfig.config.eventMinutesDuration.length > 0) {
        //Si hemos seleccionado todo el día (solo tenemos un slot), salimos
        if (slots && slots.length == 1) return;


        //Si hemos seleccionado el día, salimos
        setEvent(null)
        setEventStart(start)
        setEventEnd(null)
        setIsModalSelectDurationOpen(true)
        setResourceId(resourceId)
        return false
      }

      //Gestionamos si el evento tiene unas duraciones determinadas
      if (!evalEventConstrains(start, end)) {
        return;
      }
      setEvent(null)
      setEventStart(start)
      setEventEnd(end)
      setIsModalEventOpen(true)
      setResourceId(resourceId)
    },
    [setEvents]
  )


  const handleSelectEvent = useCallback(
    (event) => {

      //Si el evento NO es propiedad del usuario logueado, no permitimos continuar
      if (ownerConfig && event && event.feature && event.feature.properties[ownerConfig.usernameField] != userstate.username) {
        return;
      }

      setEvent(event)
      setEventStart(event.start)
      setEventEnd(event.end)
      setIsModalEventOpen(true)
    },
    []
  )

  /*
  const handleSelecting = useCallback(
    ({ start, end, resourceId}) => {
      console.log("handleSelecting start", start)
      console.log("handleSelecting resourceId", resourceId)
      if(agendaConfig.config.eventMinutesDuration && agendaConfig.config.eventMinutesDuration.length && agendaConfig.config.eventMinutesDuration.length > 0){
        setEvent(null)
        setEventStart(start)
        setEventEnd(null)
        setIsModalSelectDurationOpen(true)
        setResourceId(resourceId)      
        return false;

      }    
    },
    []
  )*/
  const handleSelecting = (e) => {
    if (agendaConfig.config.eventMinutesDuration && agendaConfig.config.eventMinutesDuration.length && agendaConfig.config.eventMinutesDuration.length > 0) {
      setEvent(null)
      setEventStart(e.start)
      setEventEnd(null)
      setIsModalSelectDurationOpen(true)
      setResourceId(e.resourceId)
      return false


    }
  }

  const setEventDurationMinutes = (duration) => {
    setIsModalSelectDurationOpen(false);
    let end = new Date(eventStart.getTime());
    end.setMinutes(end.getMinutes() + duration)
    setEventEnd(end)
    setIsModalEventOpen(true)
  }

  let messages = i18next.t('reactBigCalendar', { returnObjects: true })
  messages["showMore"] = (total) => i18next.t('reactBigCalendar.showMore', { total: total })
  let culture = i18next.language

  const { defaultDate, scrollToTime } = useMemo(
    () => ({
      defaultDate: new Date(),
      scrollToTime: new Date(1970, 1, 1, 6),
      messages: messages,
    }),
    [culture]
  )

  const getMin = () => {
    var d = new Date();
    if (agendaConfig.config.schedule) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.default.from.hours, agendaConfig.config.schedule.default.from.minutes)
      //Evaluamos en función del día de la semana
      /*
      if (d.getDay() == 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.sun.from) //Domingo
      if (d.getDay() == 1) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Lunes
      if (d.getDay() == 2) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Martes
      if (d.getDay() == 3) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Miercoles
      if (d.getDay() == 4) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Jueves
      if (d.getDay() == 5) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Viernes
      if (d.getDay() == 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.from) //Sabado
      */
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  }

  const getMax = () => {
    var d = new Date();
    if (agendaConfig.config.schedule) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.default.to.hours, agendaConfig.config.schedule.default.to.minutes)
      //Evaluamos en función del día de la semana
      /*
      if (d.getDay() == 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.sun.to) //Domingo
      if (d.getDay() == 1) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Lunes
      if (d.getDay() == 2) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Martes
      if (d.getDay() == 3) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Miercoles
      if (d.getDay() == 4) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Jueves
      if (d.getDay() == 5) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Viernes
      if (d.getDay() == 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), agendaConfig.config.schedule.mon.to) //Sabado
      */
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0)
  }

  const eventStyleGetter = (event, start, end, isSelected) => {

    //console.log("eventStyleGetter", event)
    var backgroundColor = '#edafa8';

    //let fechaActual = new Date();

    //let fechaProporcionada = event.end

    //Si el evento es propiedad del usuario logueado, cambiamos el color de fondo   
    if (ownerConfig && event && event.feature && event.feature.properties[ownerConfig.usernameField] == userstate.username) {
      backgroundColor = '#3e8245';
    }

    //si el evento ya ha pasado se cambia el color a gris
    /* if(fechaActual > fechaProporcionada) {
       backgroundColor = '#abb8c3';
     }*/

    var style = {
      backgroundColor: backgroundColor,
      borderRadius: '0px',
      opacity: 0.8,
      color: 'black',
      border: '0px',
      display: 'block'
    };
    return {
      style: style
    };
  }

  const getViews = () => {
    //Si tenemos recursos, solo mostramos la vista de día y agenda, independientemente de lo configurado
    if (agendaConfig && agendaConfig.resourceIds && agendaConfig.resourceIds.length > 0) {
      return ["day", "agenda"]
    }
    else {
      return agendaConfig.config.views
    }
  }

  const getdefaultView = () => {
    //Si tenemos recursos, mostramos por defecto la vista del día, independientemente de lo configurado
    if (agendaConfig && agendaConfig.resourceIds && agendaConfig.resourceIds.length > 0) {
      return "day"
    }
    else {
      return agendaConfig.config.defaultView
    }
  }

  const getResources = () => {

    if (agendaConfig && agendaConfig.resourceIds && agendaConfig.resourceIds.length > 0) {
      let out = []
      for (let i in agendaConfig.resourceIds) {
        out.push({ resourceId: agendaConfig.resourceIds[i].id + "", resourceTitle: agendaConfig.resourceIds[i].title })
      }
      //console.log("resources", out)
      return out;
    }
    return null
  }



  return (<>
    <div style={{ height: "100%" }} >
      {agendaConfig && <Calendar
        components={{
          dateCellWrapper: (props) => (
            <TouchCellWrapper {...props} onSelectSlot={(e) => {
              handleSelectSlot(e)
            }} />
          )
        }}
        ref={myCalendar}
        culture={culture}
        defaultDate={defaultDate}
        defaultView={getdefaultView()}
        views={getViews()}
        step={agendaConfig.config.step ? agendaConfig.config.step : 15} //TODO sacar de config
        min={getMin()} //TODO sacar de config
        max={getMax()} //TODO sacar de config
        events={myEvents}
        localizer={localizer}
        messages={messages}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="resourceTitle"
        resources={getResources()}
        onSelectEvent={(e) => {
          handleSelectEvent(e)
        }}
        eventPropGetter={(eventStyleGetter)}
        onSelecting={handleSelecting}
        onSelectSlot={(e) => {
          handleSelectSlot(e)
        }}
        onRangeChange={(e) => {
          onRangeChange(e)
        }}
        onView={handleOnView}
        selectable={agendaQgisLayer.WFSCapabilities.allowInsert}
        dayLayoutAlgorithm="no-overlap"
      />}
    </div>

    {isModalEventOpen && <ScheduleComponentEventForm map={map} schedule={schedule} editable={editable}
      feature={feature} QGISPRJ={QGISPRJ} qgisLayer={agendaQgisLayer}
      scheduleConfig={agendaConfig} event={event} isModalEventOpen={isModalEventOpen} setIsModalEventOpen={setIsModalEventOpen}
      from={from} to={to} resourceId={resourceId}
      eventStart={eventStart} eventEnd={eventEnd} eventTitle={eventTitle}
      setEventStart={setEventStart} setEventEnd={setEventEnd} setEventTitle={setEventTitle}
      reloadData={reloadData} setEvent={setEvent} codResourceValue={codResourceValue}></ScheduleComponentEventForm>}

    {
      <Modal title={i18next.t('common.actions.schedule.durationSelect')} open={isModalSelectDurationOpen}
        footer={[]} onCancel={(e) => setIsModalSelectDurationOpen(false)}>
        {agendaConfig.config.eventMinutesDuration && agendaConfig.config.eventMinutesDuration.map((duration) => {
          return <Button block onClick={() => setEventDurationMinutes(duration)}>
            {i18next.t('common.actions.schedule.durationMinutes', { duration: duration })}
          </Button>
        })}

      </Modal>}

  </>)
}

export default ScheduleComponent;
/*
const momentLocalizer = () =>{
  
}


// and, for optional time zone support
import 'moment-timezone'

moment.tz.setDefault('America/Los_Angeles')
// end optional time zone support

const localizer = momentLocalizer(moment)
*/


const TouchCellWrapper = ({ children, value, onSelectSlot }) =>
  cloneElement(Children.only(children), {
    onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
    style: {
      className: `${children}`
    }
  });
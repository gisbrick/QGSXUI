import React from 'react';
import PropTypes from 'prop-types';
import Message from '../../UI/Message/Message';
import './NotificationsQGS.css';

/**
 * Componente para mostrar notificaciones en la parte inferior derecha
 * Usa el componente Message para renderizar cada notificación
 */
const NotificationsQGS = ({ notifications, removeNotification }) => {
  // No renderizar nada si no hay notificaciones
  if (!notifications || notifications.length === 0) {    
    return null;
  }

  return (
    <div className="notifications-qgs">
      {notifications.map((notification) => (
        <Message
          key={notification.id}
          type={notification.level}
          title={notification.title}
          message={notification.text}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

NotificationsQGS.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    text: PropTypes.string,
    level: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired
  })),
  removeNotification: PropTypes.func.isRequired
};

export default NotificationsQGS;
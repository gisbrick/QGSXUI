import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useClickOutside } from '../hooks';
import { loadTranslations } from '../../../utilities/traslations';
import { useTranslation } from '../../../hooks/useTranslation';
import Toast from '../Toast/Toast';
import './NotificationCenter.css';

const NotificationCenter = ({ 
  maxNotifications = 5,
  defaultPosition = 'top-right',
  enableSound = false,
  className = '',
  lang = 'es',
  ...props 
}) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [translations, setTranslations] = useState(null);
  const idCounter = useRef(0);
  const panelRef = useRef(null);
  
  // Cargar traducciones cuando cambie el idioma
  useEffect(() => {
    const loadLang = async () => {
      const t = await loadTranslations(lang);
      setTranslations(t);
    };
    loadLang();
  }, [lang]);

  // Usar el hook de traducción
  const t = useTranslation(lang, translations);

  // Si las traducciones no están cargadas, mostrar loading
  if (!translations) {
    return null; // Para NotificationCenter, mejor no mostrar nada mientras carga
  }

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const id = ++idCounter.current;
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    // Add to notifications history
    setNotifications(prev => [newNotification, ...prev.slice(0, maxNotifications - 1)]);

    // Add toast for immediate display
    setToasts(prev => [...prev, newNotification]);

    // Play sound if enabled
    if (enableSound && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAAA4AYAAMhYAQACABAAAgAEAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
        audio.play().catch(() => {}); // Ignore errors
      } catch (e) {
        // Ignore audio errors
      }
    }

    return id;
  }, [maxNotifications, enableSound]);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Remove notification from history
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setToasts([]);
  }, []);

  // Toggle panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  // Close panel
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  useClickOutside(panelRef, closePanel);

  // Expose API for global use
  useEffect(() => {
    window.NotificationCenter = { 
      addNotification,
      addSuccess: (message, options = {}) => addNotification({ message, type: 'success', ...options }),
      addError: (message, options = {}) => addNotification({ message, type: 'error', ...options }),
      addWarning: (message, options = {}) => addNotification({ message, type: 'warning', ...options }),
      addInfo: (message, options = {}) => addNotification({ message, type: 'info', ...options }),
    };
    
    return () => { 
      delete window.NotificationCenter; 
    };
  }, [addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`notification-center ${className}`} {...props}>
      {/* Notification Panel Toggle */}
      <div className="notification-center__trigger">
        <button 
          className={`notification-center__toggle ${unreadCount > 0 ? 'notification-center__toggle--has-unread' : ''}`}
          onClick={togglePanel}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          type="button"
        >
          <span className="notification-center__icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-center__badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isPanelOpen && (
        <div 
          ref={panelRef}
          className="notification-center__panel"
          role="dialog"
          aria-label="Notifications panel"
        >
          <div className="notification-center__header">
            <h3 className="notification-center__title">Notifications</h3>
            <div className="notification-center__actions">
              {unreadCount > 0 && (
                <button 
                  className="notification-center__action-btn"
                  onClick={markAllAsRead}
                  type="button"
                >
                  {t('ui.notificationCenter.markAllRead')}
                </button>
              )}
              <button 
                className="notification-center__action-btn"
                onClick={clearAll}
                type="button"
              >
                {t('ui.notificationCenter.clearAll')}
              </button>
            </div>
          </div>

          <div className="notification-center__content">
            {notifications.length === 0 ? (
              <div className="notification-center__empty">
                <span className="notification-center__empty-icon">📭</span>
                <p>{t('ui.notificationCenter.noNotifications')}</p>
              </div>
            ) : (
              <ul className="notification-center__list" role="list">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`notification-center__item ${!notification.read ? 'notification-center__item--unread' : ''}`}
                    role="listitem"
                  >
                    <div className="notification-center__item-content">
                      <div className={`notification-center__item-indicator notification-center__item-indicator--${notification.type}`} />
                      <div className="notification-center__item-text">
                        {notification.title && (
                          <div className="notification-center__item-title">{notification.title}</div>
                        )}
                        <div className="notification-center__item-message">{notification.message}</div>
                        <div className="notification-center__item-time">
                          {notification.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="notification-center__item-actions">
                      {!notification.read && (
                        <button 
                          className="notification-center__item-action"
                          onClick={() => markAsRead(notification.id)}
                          aria-label="Mark as read"
                          type="button"
                        >
                          ✓
                        </button>
                      )}
                      <button 
                        className="notification-center__item-action"
                        onClick={() => removeNotification(notification.id)}
                        aria-label="Remove notification"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className={`notification-center__toasts notification-center__toasts--${defaultPosition}`}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={defaultPosition}
            dismissible={toast.dismissible}
            icon={toast.icon}
            action={toast.action}
            onClose={removeToast}
            onAction={toast.onAction}
          />
        ))}
      </div>
    </div>
  );
};

NotificationCenter.propTypes = {
  maxNotifications: PropTypes.number,
  defaultPosition: PropTypes.oneOf(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']),
  enableSound: PropTypes.bool,
  className: PropTypes.string,
  lang: PropTypes.string, // Idioma para las traducciones
};

export default NotificationCenter;
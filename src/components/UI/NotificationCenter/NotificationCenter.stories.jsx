import React, { useState } from 'react';
import NotificationCenter from './NotificationCenter';

export default {
    title: '04 - UI/NotificationCenter',
    component: NotificationCenter,
    parameters: {
        docs: {
            description: {
                component: 'Componente NotificationCenter para gestionar y mostrar notificaciones del sistema.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        notifications: {
            control: 'object',
            description: 'Array de notificaciones a mostrar'
        },
        position: {
            control: 'select',
            options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
            description: 'Posición donde aparecen las notificaciones'
        },
        autoClose: {
            control: 'boolean',
            description: 'Si las notificaciones se cierran automáticamente'
        },
        autoCloseDelay: {
            control: 'number',
            description: 'Tiempo en ms antes de cerrar automáticamente'
        },
        onNotificationClose: {
            action: 'notification-closed',
            description: 'Función llamada al cerrar una notificación'
        }
    },
    args: {
        notifications: [],
        position: 'top-right',
        autoClose: true,
        autoCloseDelay: 3000
    }
};

export const Default = {
    render: (args) => {
        const [notifications, setNotifications] = useState([]);
        
        const addNotification = (type, message) => {
            const newNotification = {
                id: Date.now(),
                type,
                message,
                timestamp: new Date().toISOString()
            };
            setNotifications(prev => [...prev, newNotification]);
        };

        const removeNotification = (id) => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        };

        return (
            <div>
                <div style={{ marginBottom: '20px' }}>
                    <button 
                        onClick={() => addNotification('success', 'Operación completada correctamente')}
                        style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Agregar Éxito
                    </button>
                    <button 
                        onClick={() => addNotification('error', 'Ha ocurrido un error')}
                        style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Agregar Error
                    </button>
                    <button 
                        onClick={() => addNotification('warning', 'Advertencia: revisa la configuración')}
                        style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Agregar Advertencia
                    </button>
                    <button 
                        onClick={() => addNotification('info', 'Información importante')}
                        style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Agregar Info
                    </button>
                </div>
                <NotificationCenter
                    {...args}
                    notifications={notifications}
                    onNotificationClose={removeNotification}
                />
            </div>
        );
    }
};

export const WithInitialNotifications = {
    args: {
        notifications: [
            {
                id: 1,
                type: 'success',
                message: 'Archivo guardado correctamente',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                type: 'warning',
                message: 'La conexión es lenta',
                timestamp: new Date().toISOString()
            },
            {
                id: 3,
                type: 'info',
                message: 'Nueva versión disponible',
                timestamp: new Date().toISOString()
            }
        ]
    }
};

export const BottomLeft = {
    args: {
        position: 'bottom-left',
        notifications: [
            {
                id: 1,
                type: 'error',
                message: 'Error de conexión con el servidor',
                timestamp: new Date().toISOString()
            }
        ]
    }
};

export const NoAutoClose = {
    args: {
        autoClose: false,
        notifications: [
            {
                id: 1,
                type: 'info',
                message: 'Esta notificación no se cierra automáticamente',
                timestamp: new Date().toISOString()
            }
        ]
    }
};

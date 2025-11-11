import React from 'react';
import ConfirmDialog from './ConfirmDialog';

export default {
    title: '04 - UI/ConfirmDialog',
    component: ConfirmDialog,
    parameters: {
        docs: {
            description: {
                component: 'Componente ConfirmDialog para mostrar diálogos de confirmación con diferentes variantes y acciones personalizables.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        open: { 
            control: 'boolean',
            description: 'Controla si el diálogo está abierto o cerrado'
        },
        title: { 
            control: 'text',
            description: 'Título del diálogo de confirmación'
        },
        message: { 
            control: 'text',
            description: 'Mensaje principal del diálogo'
        },
        confirmText: { 
            control: 'text',
            description: 'Texto del botón de confirmación'
        },
        cancelText: { 
            control: 'text',
            description: 'Texto del botón de cancelación'
        },
        variant: { 
            control: 'select',
            options: ['default', 'danger', 'warning'],
            description: 'Variante visual del diálogo'
        },
        onConfirm: {
            action: 'confirmed',
            description: 'Función llamada al confirmar'
        },
        onCancel: {
            action: 'cancelled',
            description: 'Función llamada al cancelar'
        }
    },
    args: {
        open: true,
        title: 'Confirmación',
        message: '¿Estás seguro de que deseas continuar?',
        confirmText: 'Sí',
        cancelText: 'No',
        variant: 'default'
    }
};

export const Default = {
    args: {
        open: true,
        title: 'Confirmación',
        message: '¿Estás seguro de que deseas continuar?',
        confirmText: 'Sí',
        cancelText: 'No',
        variant: 'default'
    }
};

export const Danger = {
    args: {
        open: true,
        title: 'Eliminar elemento',
        message: 'Esta acción no se puede deshacer. ¿Estás seguro?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
    }
};

export const Warning = {
    args: {
        open: true,
        title: 'Advertencia',
        message: 'Hay cambios sin guardar. ¿Deseas continuar?',
        confirmText: 'Continuar',
        cancelText: 'Cancelar',
        variant: 'warning'
    }
};
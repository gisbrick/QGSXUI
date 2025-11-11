import React from 'react';
import ContextMenu from './ContextMenu';

export default {
    title: '04 - UI/ContextMenu',
    component: ContextMenu,
    parameters: {
        docs: {
            description: {
                component: 'Componente ContextMenu que muestra un menú contextual al hacer click derecho sobre un elemento.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        items: { 
            control: 'object',
            description: 'Array de elementos del menú contextual'
        },
        children: {
            description: 'Elemento hijo que activará el menú contextual'
        },
        locale: {
            control: 'select',
            options: ['es', 'en'],
            description: 'Idioma para las traducciones'
        }
    },
    args: {
        items: [
            { 
                id: 'copy',
                label: 'Copiar', 
                icon: '📋',
                onClick: () => console.log('Copiar seleccionado') 
            },
            { 
                id: 'cut',
                label: 'Cortar', 
                icon: '✂️',
                onClick: () => console.log('Cortar seleccionado') 
            },
            { 
                id: 'paste',
                label: 'Pegar', 
                icon: '📄',
                shortcut: 'Ctrl+V',
                onClick: () => console.log('Pegar seleccionado') 
            },
            { 
                id: 'delete',
                label: 'Eliminar', 
                icon: '🗑️',
                shortcut: 'Del',
                onClick: () => console.log('Eliminar seleccionado') 
            }
        ],
        locale: 'es'
    }
};

export const Default = {
    render: (args) => (
        <div style={{ padding: '50px', backgroundColor: '#f5f5f5', minHeight: '300px' }}>
            <p>Haz click derecho en esta área para ver el menú contextual</p>
            <ContextMenu {...args}>
                <div style={{ 
                    padding: '20px', 
                    backgroundColor: 'white', 
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}>
                    Click derecho aquí
                </div>
            </ContextMenu>
        </div>
    )
};

export const WithDisabledItems = {
    args: {
        items: [
            { 
                id: 'new',
                label: 'Nuevo', 
                icon: '�',
                onClick: () => console.log('Nuevo seleccionado') 
            },
            { 
                id: 'open',
                label: 'Abrir', 
                icon: '📂',
                onClick: () => console.log('Abrir seleccionado') 
            },
            { 
                id: 'save',
                label: 'Guardar', 
                icon: '�',
                shortcut: 'Ctrl+S',
                disabled: true,
                onClick: () => console.log('Guardar seleccionado') 
            },
            { 
                id: 'saveAs',
                label: 'Guardar como...', 
                icon: '�',
                onClick: () => console.log('Guardar como seleccionado') 
            }
        ]
    },
    render: (args) => (
        <div style={{ padding: '50px', backgroundColor: '#f5f5f5', minHeight: '300px' }}>
            <p>Haz click derecho para ver el menú con elementos deshabilitados</p>
            <ContextMenu {...args}>
                <div style={{ 
                    padding: '20px', 
                    backgroundColor: 'white', 
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}>
                    Click derecho aquí
                </div>
            </ContextMenu>
        </div>
    )
};

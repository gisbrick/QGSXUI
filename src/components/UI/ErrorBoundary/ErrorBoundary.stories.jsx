import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = ({ shouldThrow, errorMessage }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error for ErrorBoundary');
  }
  return <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '4px' }}>
    ✅ Componente funcionando correctamente
  </div>;
};

const ComplexComponent = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <h3>Componente Complejo</h3>
      <p>Este es un componente que funciona normalmente</p>
      <button onClick={() => alert('¡Funciona!')}>Probar</button>
    </div>
  );
};

export default {
  title: '04 - UI/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export const NoError = {
  args: {
    children: <ComplexComponent />,
  },
};

export const WithError = {
  args: {
    children: <ThrowError shouldThrow={true} />,
  },
};

export const CustomErrorMessage = {
  args: {
    title: 'Error de Conexión',
    message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    children: <ThrowError shouldThrow={true} errorMessage="Network connection failed" />,
  },
};

export const WithErrorDetails = {
  args: {
    showDetails: true,
    children: <ThrowError shouldThrow={true} errorMessage="Component crashed with detailed error" />,
  },
};

export const CustomFallback = {
  args: {
    fallback: (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px' 
      }}>
        <h3>🔧 Modo Mantenimiento</h3>
        <p>Esta sección está temporalmente fuera de servicio.</p>
      </div>
    ),
    children: <ThrowError shouldThrow={true} />,
  },
};

export const WithCallbacks = {
  args: {
    children: <ThrowError shouldThrow={true} />,
    onError: (error, errorInfo) => {
      console.log('Error capturado:', error);
      console.log('Info del error:', errorInfo);
    },
    onReset: () => {
      alert('Reiniciando aplicación...');
    },
  },
};
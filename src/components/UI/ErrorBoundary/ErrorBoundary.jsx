import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../utilities/traslations';
import { useTranslation } from '../../../hooks/useTranslation';
import './ErrorBoundary.css';

// Hook para manejo de errores
const useErrorHandler = () => {
  const [error, setError] = useState(null);
  
  return {
    error,
    setError,
    clearError: () => setError(null)
  };
};

// Componente funcional ErrorFallback
const ErrorFallback = ({ 
  error, 
  onRetry, 
  onReset, 
  title, 
  message, 
  showDetails = false,
  lang = 'es' 
}) => {
  const [translations, setTranslations] = useState(null);

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

  // Si las traducciones no están cargadas, mostrar fallback básico
  if (!translations) {
    return (
      <div className="error-boundary">
        <div className="error-boundary__icon">⚠️</div>
        <h2 className="error-boundary__title">Error</h2>
        <p className="error-boundary__message">Loading...</p>
      </div>
    );
  }

  return (
    <div className="error-boundary">
      <div className="error-boundary__icon">⚠️</div>
      <h2 className="error-boundary__title">
        {title || t('ui.errorBoundary.title')}
      </h2>
      <p className="error-boundary__message">
        {message || t('ui.errorBoundary.message')}
      </p>
      
      {showDetails && error && (
        <details className="error-boundary__details">
          <summary>{t('ui.errorBoundary.details')}</summary>
          <pre className="error-boundary__error-text">
            {error.toString()}
          </pre>
        </details>
      )}
      
      <div className="error-boundary__actions">
        <button 
          className="error-boundary__button error-boundary__button--primary"
          onClick={onRetry}
        >
          {t('ui.errorBoundary.retry')}
        </button>
        {onReset && (
          <button 
            className="error-boundary__button error-boundary__button--secondary"
            onClick={onReset}
          >
            {t('ui.errorBoundary.reset')}
          </button>
        )}
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Captura el error y la información adicional
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aquí podrías enviar el error a un servicio de logging
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onReset={this.props.onReset}
          title={this.props.title}
          message={this.props.message}
          showDetails={this.props.showDetails}
          lang={this.props.lang}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  title: PropTypes.string,
  message: PropTypes.string,
  showDetails: PropTypes.bool,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  lang: PropTypes.string // Idioma para las traducciones
};

ErrorBoundary.defaultProps = {
  showDetails: false,
  lang: 'es'
};

export default ErrorBoundary;

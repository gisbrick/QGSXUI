import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';

export default {
  title: '04 - UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    lang: {
      control: { type: 'select' },
      options: ['es', 'en'], // Solo idiomas disponibles en src/locales
      description: 'Idioma para las traducciones (se pueden añadir más en src/locales)',
    },
    showFirstLast: {
      control: { type: 'boolean' },
    },
    showNumbers: {
      control: { type: 'boolean' },
    },
    maxVisiblePages: {
      control: { type: 'number', min: 3, max: 10 },
    },
  },
};

// Template con estado para interactividad
const TemplateWithState = (args) => {
  const [currentPage, setCurrentPage] = useState(args.currentPage || 1);
  const [translations, setTranslations] = useState(null);

  // Cargar traducciones
  useEffect(() => {
    const loadLang = async () => {
      const t = await loadTranslations(args.lang || 'es');
      setTranslations(t);
    };
    loadLang();
  }, [args.lang]);

  // Usar el hook de traducción
  const t = useTranslation(args.lang || 'es', translations);

  if (!translations) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Pagination
        {...args}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <p style={{ marginTop: '20px', color: '#666' }}>
        {t('ui.common.page')} actual: {currentPage}
      </p>
    </div>
  );
};

export const Default = TemplateWithState.bind({});
Default.args = {
  currentPage: 3,
  totalPages: 10,
  size: 'medium',
  lang: 'es',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

export const Small = TemplateWithState.bind({});
Small.args = {
  currentPage: 2,
  totalPages: 8,
  size: 'small',
  lang: 'es',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

export const Large = TemplateWithState.bind({});
Large.args = {
  currentPage: 5,
  totalPages: 12,
  size: 'large',
  lang: 'es',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 7,
};

export const WithoutNumbers = TemplateWithState.bind({});
WithoutNumbers.args = {
  currentPage: 4,
  totalPages: 20,
  size: 'medium',
  showFirstLast: true,
  showNumbers: false,
};

export const SimpleNavigation = TemplateWithState.bind({});
SimpleNavigation.args = {
  currentPage: 2,
  totalPages: 5,
  size: 'medium',
  showFirstLast: false,
  showNumbers: false,
};

export const ManyPages = TemplateWithState.bind({});
ManyPages.args = {
  currentPage: 15,
  totalPages: 100,
  size: 'medium',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

export const FewPages = TemplateWithState.bind({});
FewPages.args = {
  currentPage: 2,
  totalPages: 3,
  size: 'medium',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

// Ejemplo de uso en diferentes contextos
export const InTableFooter = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Tabla de datos</h3>
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{(currentPage - 1) * 5 + i + 1}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Usuario {(currentPage - 1) * 5 + i + 1}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>user{(currentPage - 1) * 5 + i + 1}@example.com</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            Mostrando {(currentPage - 1) * 5 + 1} - {Math.min(currentPage * 5, 47)} de 47 resultados
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
            size="small"
            lang="es"
            showFirstLast={false}
          />
        </div>
      </div>
    </div>
  );
};

// Historias para demostrar diferentes idiomas
export const EnglishLanguage = TemplateWithState.bind({});
EnglishLanguage.args = {
  currentPage: 2,
  totalPages: 8,
  size: 'medium',
  lang: 'en',
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

// Ejemplo con idioma no disponible (fallback a español)
export const UnsupportedLanguage = TemplateWithState.bind({});
UnsupportedLanguage.args = {
  currentPage: 3,
  totalPages: 10,
  size: 'medium',
  lang: 'fr', // Este idioma no existe, debería usar fallback a español
  showFirstLast: true,
  showNumbers: true,
  maxVisiblePages: 5,
};

// Comparación de idiomas disponibles
const LanguageComparison = () => {
  const [currentPage, setCurrentPage] = useState(2);
  const languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' }
  ];
  
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Comparación de Idiomas Disponibles</h3>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Para añadir más idiomas, crea nuevos archivos en src/locales/[idioma]/translation.json
      </p>
      {languages.map(lang => (
        <div key={lang.code} style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', color: '#374151' }}>{lang.name}</h4>
          <Pagination
            currentPage={currentPage}
            totalPages={15}
            onPageChange={setCurrentPage}
            size="medium"
            lang={lang.code}
            showFirstLast={true}
            showNumbers={false}
          />
        </div>
      ))}
    </div>
  );
};

export const LanguageSupport = LanguageComparison;
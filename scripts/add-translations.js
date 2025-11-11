#!/usr/bin/env node

/**
 * Script para automatizar la adición de soporte de traducciones a todos los componentes UI
 */

const fs = require('fs');
const path = require('path');

// Configuración de componentes y sus traducciones específicas
const componentTranslations = {
  'ContextMenu': 'ui.contextMenu',
  'Drawer': 'ui.drawer',
  'Modal': 'ui.modal',
  'NotificationCenter': 'ui.notification',
  'Pagination': 'ui.pagination',
  'SidePanel': 'ui.sidePanel',
  'SplitPane': 'ui.splitPane',
  'Spinner': 'ui.common',
  'SkeletonLoader': 'ui.common',
  'Table': 'ui.table',
  'Tabs': 'ui.tabs',
  'Toast': 'ui.toast',
  'Tooltip': 'ui.tooltip',
  'TreeView': 'ui.treeView',
  'Message': 'ui.common',
  'ErrorBoundary': 'ui.common'
};

// Componentes de controles
const controlTranslations = {
  'CheckboxControl': 'ui.controls.checkbox',
  'TextControl': 'ui.controls.textInput',
  'ValueMapControl': 'ui.controls.select'
};

// Función para añadir import y hook de traducción
function addTranslationSupport(filePath, componentName, namespace) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Verificar si ya tiene soporte de traducciones
  if (content.includes('useUITranslation') || content.includes('locale:') || content.includes('translations:')) {
    console.log(`✅ ${componentName} ya tiene soporte de traducciones`);
    return;
  }

  // Añadir import
  if (!content.includes("import useUITranslation from '../hooks/useTranslation';")) {
    content = content.replace(
      /import PropTypes from 'prop-types';/,
      "import PropTypes from 'prop-types';\nimport useUITranslation from '../hooks/useTranslation';"
    );
  }

  // Añadir props locale y translations a la destructuring
  const propsRegex = /const\s+\w+\s*=\s*\(\s*{\s*([^}]+)\s*}\s*\)\s*=>/;
  const match = content.match(propsRegex);
  
  if (match) {
    const currentProps = match[1];
    if (!currentProps.includes('locale') && !currentProps.includes('translations')) {
      const newProps = currentProps.trim().endsWith(',') 
        ? currentProps + '\n  locale,\n  translations,'
        : currentProps + ',\n  locale,\n  translations,';
      
      content = content.replace(propsRegex, `const ${componentName} = ({ ${newProps} }) =>`);
    }
  }

  // Añadir hook de traducción después de la destructuring
  const hookLine = `\n  // Hook de traducción\n  const { t } = useUITranslation('${namespace}', { locale, translations });\n`;
  
  // Buscar donde insertar el hook (después de la destructuring de props)
  const insertPoint = content.indexOf(') => {') + 6;
  if (insertPoint > 5) {
    content = content.slice(0, insertPoint) + hookLine + content.slice(insertPoint);
  }

  // Añadir PropTypes
  const propTypesRegex = /(\w+\.propTypes\s*=\s*{[^}]*)(};)/s;
  const propTypesMatch = content.match(propTypesRegex);
  
  if (propTypesMatch) {
    const currentPropTypes = propTypesMatch[1];
    if (!currentPropTypes.includes('locale:') && !currentPropTypes.includes('translations:')) {
      const newPropTypes = currentPropTypes.trim().endsWith(',')
        ? currentPropTypes + '\n  locale: PropTypes.string,\n  translations: PropTypes.object,'
        : currentPropTypes + ',\n  locale: PropTypes.string,\n  translations: PropTypes.object,';
      
      content = content.replace(propTypesRegex, newPropTypes + '};');
    }
  }

  // Escribir archivo actualizado
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ ${componentName} actualizado con soporte de traducciones`);
}

// Función principal
function main() {
  console.log('🚀 Iniciando actualización de componentes con soporte de traducciones...\n');

  const baseUIPath = './src/components/UI';
  const baseControlsPath = './src/components/controls';

  // Actualizar componentes UI
  Object.entries(componentTranslations).forEach(([componentName, namespace]) => {
    const filePath = path.join(baseUIPath, componentName, `${componentName}.jsx`);
    addTranslationSupport(filePath, componentName, namespace);
  });

  // Actualizar controles
  Object.entries(controlTranslations).forEach(([componentName, namespace]) => {
    const filePath = path.join(baseControlsPath, componentName, `${componentName}.jsx`);
    addTranslationSupport(filePath, componentName, namespace);
  });

  console.log('\n🎉 ¡Actualización completada!');
  console.log('\n📝 Pasos siguientes:');
  console.log('1. Revisar los componentes actualizados');
  console.log('2. Añadir traducciones específicas donde sea necesario');
  console.log('3. Actualizar las stories para mostrar ejemplos con diferentes idiomas');
  console.log('4. Probar la funcionalidad en Storybook');
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  main();
}

module.exports = {
  addTranslationSupport,
  componentTranslations,
  controlTranslations
};

# Plan de Refactorización del Proyecto

## Objetivos
- Simplificar código eliminando redundancias
- Dividir componentes grandes en componentes más pequeños y reutilizables
- Aplicar principio de responsabilidad única (SRP)
- Mejorar legibilidad y mantenibilidad
- Mantener compatibilidad y funcionalidad existente

## Componentes Identificados para Refactorización

### 1. FeatureAttributesDialog (637 líneas)
**Problemas:**
- Componente muy grande con múltiples responsabilidades
- Lógica de traducción compleja mezclada con lógica de UI
- Componente interno FormActionsComponent muy complejo
- Manejo de estado disperso

**Solución:**
- ✅ `hooks/useFeatureDialogTranslation.js` - Hook para manejar traducciones
- ✅ `components/FeatureFormActions.jsx` - Componente separado para acciones del formulario
- ✅ `components/FeatureDialogFooter.jsx` - Componente para el footer del diálogo
- ⏳ Refactorizar componente principal para usar estos nuevos componentes

### 2. MapToolbar (~845 líneas estimadas)
**Problemas:**
- Lógica de múltiples herramientas mezclada
- Manejo de estado complejo
- Funciones de callback muy largas

**Solución propuesta:**
- Extraer lógica de herramientas a hooks separados
- Crear componentes para cada herramienta
- Simplificar manejo de estado

### 3. FormProvider y hooks relacionados
**Problemas:**
- Lógica compleja en hooks
- Múltiples responsabilidades

**Solución propuesta:**
- Simplificar hooks existentes
- Separar responsabilidades

### 4. Redundancias entre controls/ y UI_QGS_Form/
**Problemas:**
- Controles duplicados en dos ubicaciones
- Mantenimiento duplicado

**Solución propuesta:**
- Unificar controles en una sola ubicación
- Crear sistema de controles base reutilizable

## Cambios Realizados

### Fase 1: FeatureAttributesDialog (En progreso)
1. ✅ Creado `useFeatureDialogTranslation.js` - Hook para traducciones
2. ✅ Creado `FeatureFormActions.jsx` - Componente para acciones del formulario
3. ✅ Creado `FeatureDialogFooter.jsx` - Componente para footer
4. ⏳ Refactorizar componente principal

## Próximos Pasos

1. Completar refactorización de FeatureAttributesDialog
2. Refactorizar MapToolbar
3. Simplificar FormProvider y hooks
4. Eliminar redundancias entre controls/ y UI_QGS_Form/
5. Crear utilidades compartidas
6. Documentar cambios

## Notas
- Todos los cambios mantienen la funcionalidad existente
- Se prioriza la legibilidad y mantenibilidad
- Cada componente tiene una única responsabilidad


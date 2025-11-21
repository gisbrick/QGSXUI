import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getFilterTypeForField } from './filterUtils';
import { fetchFeatures } from '../../../../services/qgisWFSFetcher';

const parseWidgetConfig = (field) => {
  if (!field?.editorWidgetSetup?.config) {
    return {};
  }
  if (typeof field.editorWidgetSetup.config === 'string') {
    try {
      return JSON.parse(field.editorWidgetSetup.config);
    } catch (err) {
      console.warn('ColumnFilterPopover: error parsing widget config', err);
      return {};
    }
  }
  return field.editorWidgetSetup.config || {};
};

const useSelectOptions = (field, qgsUrl, qgsProjectPath, token) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const widgetType = (field?.editorWidgetSetup?.type || '').toLowerCase();
    const config = parseWidgetConfig(field);

    const buildOptionsFromValueMap = () => {
      const map = config?.map || config?.Map || null;
      if (!map) return [];
      if (Array.isArray(map)) {
        return map.flatMap((entry) => {
          const [label, value] = Object.entries(entry)[0] || [];
          if (label === undefined || value === undefined) return [];
          return [{ label, value }];
        });
      }
      return Object.entries(map).map(([label, value]) => ({ label, value }));
    };

    if (widgetType === 'valuemap') {
      setOptions(buildOptionsFromValueMap());
      return () => {};
    }

    if (widgetType === 'valuerelation' || widgetType === 'relationreference') {
      const layerName = config?.Layer || config?.layer;
      const keyField = config?.Key || config?.key || config?.Field || config?.field;
      const valueField = config?.Value || config?.value || config?.Description || config?.description;

      if (!layerName || !keyField || !valueField || !qgsUrl || !qgsProjectPath) {
        return () => {};
      }

      setLoading(true);
      fetchFeatures(qgsUrl, qgsProjectPath, layerName, '', 0, 200, token)
        .then((features) => {
          if (cancelled) return;
          const opts = features.map((feature) => ({
            label: feature.properties?.[valueField],
            value: feature.properties?.[keyField]
          }));
          setOptions(opts.filter((opt) => opt.label !== undefined && opt.value !== undefined));
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn('[ColumnFilterPopover] Error fetching relation options', err);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    return () => {};
  }, [field, qgsUrl, qgsProjectPath, token]);

  return { options, loading };
};

const ColumnFilterPopover = ({
  field,
  currentFilter,
  onApply,
  onClear,
  onClose,
  translate,
  qgsUrl,
  qgsProjectPath,
  token
}) => {
  const filterType = getFilterTypeForField(field);
  const [localFilter, setLocalFilter] = useState(
    currentFilter || {
      type: filterType,
      mode: filterType === 'number' ? 'equals' : filterType === 'date' ? 'equals' : 'contains',
      value: '',
      valueTo: '',
      values: filterType === 'select' ? [] : undefined
    }
  );

  useEffect(() => {
    setLocalFilter((prev) => ({
      ...prev,
      ...(currentFilter || {
        type: filterType,
        mode: filterType === 'number' ? 'equals' : filterType === 'date' ? 'equals' : 'contains',
        value: '',
        valueTo: '',
        values: filterType === 'select' ? [] : undefined
      })
    }));
  }, [currentFilter, filterType]);

  const { options, loading: optionsLoading } = useSelectOptions(field, qgsUrl, qgsProjectPath, token);

  const handleChange = (patch) => {
    setLocalFilter((prev) => ({
      ...prev,
      ...patch
    }));
  };

  const handleApply = () => {
    if (filterType === 'text' && !localFilter.value) {
      onClear();
      onClose();
      return;
    }
    if (filterType === 'number' && (localFilter.value === '' || localFilter.value === null)) {
      onClear();
      onClose();
      return;
    }
    if (filterType === 'date' && !localFilter.value) {
      onClear();
      onClose();
      return;
    }
    if (filterType === 'select' && (!localFilter.values || localFilter.values.length === 0)) {
      onClear();
      onClose();
      return;
    }
    onApply({ ...localFilter, type: filterType });
    onClose();
  };

  const renderTextFilter = () => (
    <>
      <label className="table-filter__label">{translate('ui.table.filter.mode')}</label>
      <select
        value={localFilter.mode || 'contains'}
        onChange={(e) => handleChange({ mode: e.target.value })}
      >
        <option value="contains">{translate('ui.table.filter.contains')}</option>
        <option value="equals">{translate('ui.table.filter.equals')}</option>
        <option value="startsWith">{translate('ui.table.filter.startsWith')}</option>
        <option value="endsWith">{translate('ui.table.filter.endsWith')}</option>
        <option value="doesNotContain">{translate('ui.table.filter.notContains')}</option>
      </select>
      <label className="table-filter__label">{translate('ui.table.filter.value')}</label>
      <input
        type="text"
        value={localFilter.value || ''}
        onChange={(e) => handleChange({ value: e.target.value })}
      />
    </>
  );

  const renderNumberFilter = () => (
    <>
      <label className="table-filter__label">{translate('ui.table.filter.mode')}</label>
      <select
        value={localFilter.mode || 'equals'}
        onChange={(e) => handleChange({ mode: e.target.value })}
      >
        <option value="equals">{translate('ui.table.filter.equals')}</option>
        <option value="notEquals">{translate('ui.table.filter.notEquals')}</option>
        <option value="greater">{translate('ui.table.filter.greater')}</option>
        <option value="greaterOrEqual">{translate('ui.table.filter.greaterOrEqual')}</option>
        <option value="less">{translate('ui.table.filter.less')}</option>
        <option value="lessOrEqual">{translate('ui.table.filter.lessOrEqual')}</option>
        <option value="between">{translate('ui.table.filter.between')}</option>
      </select>
      <label className="table-filter__label">{translate('ui.table.filter.value')}</label>
      <input
        type="number"
        value={localFilter.value || ''}
        onChange={(e) => handleChange({ value: e.target.value })}
      />
      {localFilter.mode === 'between' && (
        <>
          <label className="table-filter__label">{translate('ui.table.filter.valueTo')}</label>
          <input
            type="number"
            value={localFilter.valueTo || ''}
            onChange={(e) => handleChange({ valueTo: e.target.value })}
          />
        </>
      )}
    </>
  );

  const renderDateFilter = () => (
    <>
      <label className="table-filter__label">{translate('ui.table.filter.mode')}</label>
      <select
        value={localFilter.mode || 'equals'}
        onChange={(e) => handleChange({ mode: e.target.value })}
      >
        <option value="equals">{translate('ui.table.filter.equals')}</option>
        <option value="before">{translate('ui.table.filter.before')}</option>
        <option value="after">{translate('ui.table.filter.after')}</option>
        <option value="between">{translate('ui.table.filter.between')}</option>
      </select>
      <label className="table-filter__label">{translate('ui.table.filter.value')}</label>
      <input
        type="date"
        value={localFilter.value || ''}
        onChange={(e) => handleChange({ value: e.target.value })}
      />
      {localFilter.mode === 'between' && (
        <>
          <label className="table-filter__label">{translate('ui.table.filter.valueTo')}</label>
          <input
            type="date"
            value={localFilter.valueTo || ''}
            onChange={(e) => handleChange({ valueTo: e.target.value })}
          />
        </>
      )}
    </>
  );

  const renderBooleanFilter = () => (
    <>
      <label className="table-filter__label">{translate('ui.table.filter.value')}</label>
      <select
        value={
          localFilter.value === true
            ? 'true'
            : localFilter.value === false
              ? 'false'
              : ''
        }
        onChange={(e) => {
          const val = e.target.value;
          handleChange({
            value: val === 'true' ? true : val === 'false' ? false : null
          });
        }}
      >
        <option value="">{translate('ui.table.filter.any')}</option>
        <option value="true">{translate('ui.common.yes') || 'Sí'}</option>
        <option value="false">{translate('ui.common.no') || 'No'}</option>
      </select>
    </>
  );

  const renderSelectFilter = () => (
    <>
      <label className="table-filter__label">{translate('ui.table.filter.value')}</label>
      {optionsLoading ? (
        <div className="table-filter__loading">{translate('ui.table.loading')}</div>
      ) : (
        <select
          multiple
          value={localFilter.values || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
            handleChange({ values: selected });
          }}
        >
          {options.map((option) => (
            <option key={`${option.value}`} value={option.value}>
              {option.label ?? option.value}
            </option>
          ))}
        </select>
      )}
    </>
  );

  const renderFilterBody = () => {
    switch (filterType) {
      case 'text':
        return renderTextFilter();
      case 'number':
        return renderNumberFilter();
      case 'date':
        return renderDateFilter();
      case 'boolean':
        return renderBooleanFilter();
      case 'select':
        return renderSelectFilter();
      default:
        return renderTextFilter();
    }
  };

  return (
    <div className="table-filter__popover">
      <div className="table-filter__title">
        {translate('ui.table.filter.title', { field: field.alias || field.name })}
      </div>
      <div className="table-filter__body">{renderFilterBody()}</div>
      <div className="table-filter__actions">
        <button type="button" onClick={() => { onClear(); onClose(); }}>
          <i className="fas fa-filter-circle-xmark" aria-hidden="true" />
          {translate('ui.table.filter.clear')}
        </button>
        <button type="button" className="table-filter__apply" onClick={handleApply}>
          <i className="fas fa-check" aria-hidden="true" />
          {translate('ui.table.filter.apply')}
        </button>
      </div>
    </div>
  );
};

ColumnFilterPopover.propTypes = {
  field: PropTypes.object.isRequired,
  currentFilter: PropTypes.object,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  qgsUrl: PropTypes.string,
  qgsProjectPath: PropTypes.string,
  token: PropTypes.string,
  onClearAll: PropTypes.func
};

export default ColumnFilterPopover;


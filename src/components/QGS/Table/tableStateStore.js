const tableStateStore = new Map();

export const getTableState = (key) => {
  return tableStateStore.get(key) || null;
};

export const setTableState = (key, partial) => {
  const prev = tableStateStore.get(key) || {};
  tableStateStore.set(key, { ...prev, ...partial });
};

export const clearTableState = (key) => {
  tableStateStore.delete(key);
};

export const resetTableState = () => {
  tableStateStore.clear();
};


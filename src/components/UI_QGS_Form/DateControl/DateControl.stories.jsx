import DateControl from './DateControl';

export default {
  title: '03 - UI-QGS-Form-Controls/DateControl',
  component: DateControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Date Control',
  },
};

export const WithValue = {
  args: {
    label: 'Date with Value',
    value: '2024-01-01',
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Date',
    disabled: true,
  },
};

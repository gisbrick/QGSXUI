import NumberControl from './NumberControl';

export default {
  title: '03 - UI-QGS-Form-Controls/NumberControl',
  component: NumberControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Number Control',
    placeholder: 'Enter a number...',
  },
};

export const WithMinMax = {
  args: {
    label: 'Number with Range',
    placeholder: 'Enter 1-100',
    min: 1,
    max: 100,
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Number',
    placeholder: 'Disabled field',
    disabled: true,
  },
};

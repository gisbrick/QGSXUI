import BaseControl from './BaseControl';

export default {
  title: '03 - UI-QGS-Form-Controls/BaseControl',
  component: BaseControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Base Control',
    children: <input type="text" placeholder="Enter value..." />,
  },
};

export const Required = {
  args: {
    label: 'Required Field',
    required: true,
    children: <input type="text" placeholder="Enter value..." />,
  },
};

export const WithError = {
  args: {
    label: 'Field with Error',
    error: 'This field is required',
    children: <input type="text" placeholder="Enter value..." />,
  },
};
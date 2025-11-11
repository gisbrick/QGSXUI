import TextControl from './TextControl';

export default {
  title: '03 - UI-QGS-Form-Controls/TextControl',
  component: TextControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Text Control',
    placeholder: 'Enter text...',
  },
};

export const WithError = {
  args: {
    label: 'Text with Error',
    placeholder: 'Enter text...',
    error: 'This field is required',
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Text',
    placeholder: 'Disabled field',
    disabled: true,
  },
};
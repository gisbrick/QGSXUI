import ValueMapControl from './ValueMapControl';

export default {
  title: '03 - UI-QGS-Form-Controls/ValueMapControl',
  component: ValueMapControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Value Map Control',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
};

export const WithSelectedValue = {
  args: {
    label: 'Value Map with Selection',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    value: 'option2',
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Value Map',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
    disabled: true,
  },
};
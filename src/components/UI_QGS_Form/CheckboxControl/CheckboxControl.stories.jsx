import CheckboxControl from './CheckboxControl';

export default {
  title: '03 - UI-QGS-Form-Controls/CheckboxControl',
  component: CheckboxControl,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    label: 'Checkbox Control',
    checked: false,
  },
};

export const Checked = {
  args: {
    label: 'Checked Checkbox',
    checked: true,
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Checkbox',
    disabled: true,
  },
};
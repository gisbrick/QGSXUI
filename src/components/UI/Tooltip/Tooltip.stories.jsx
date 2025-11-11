import React from 'react';
import Tooltip from './Tooltip';

export default {
  title: '04 - UI/Tooltip',
  component: Tooltip
};

export const Default = {
  args: { content: 'Tooltip text' },
  render: (args) => (
    <Tooltip {...args}>
      <button>Hover me</button>
    </Tooltip>
  )
};
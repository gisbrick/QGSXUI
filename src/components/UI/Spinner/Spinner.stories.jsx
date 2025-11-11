import React from 'react';
import Spinner from './Spinner';

export default {
  title: '04 - UI/Spinner',
  component: Spinner,
  argTypes: {
    size: {
      control: 'select', 
      options: ['small', 'medium', 'large', 'extra-large']
    }
  }
};

export const Default = {
  args: {
    size: 'medium'
  }
};

export const Small = {
  args: {
    size: 'small'
  }
};

export const Large = {
  args: {
    size: 'large'
  }
};
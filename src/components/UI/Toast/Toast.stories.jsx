import React from 'react';
import Toast from './Toast';

export default {
  title: '04 - UI/Toast',
  component: Toast
};

export const Info = {
  args: {
    message: 'Información',
    type: 'info'
  }
};

export const Success = {
  args: {
    message: 'Éxito',
    type: 'success'
  }
};

export const Error = {
  args: {
    message: 'Error',
    type: 'error'
  }
};
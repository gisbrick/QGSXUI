import React from 'react';
import NotificationsQGS from './NotificationsQGS';

export default {
  title: '02 - UI-QGS/NotificationsQGS',
  component: NotificationsQGS,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs']
};

// Mock de las funciones para las historias
const mockRemoveNotification = (id) => {
  console.log('Remove notification:', id);
};

export const Empty = {
  args: {
    notifications: [],
    removeNotification: mockRemoveNotification
  },
};

export const SingleNotification = {
  args: {
    notifications: [
      {
        id: 1,
        title: 'Information',
        text: 'This is a sample notification message.',
        level: 'info'
      }
    ],
    removeNotification: mockRemoveNotification
  },
};

export const MultipleNotifications = {
  args: {
    notifications: [
      {
        id: 1,
        title: 'Success',
        text: 'Operation completed successfully!',
        level: 'success'
      },
      {
        id: 2,
        title: 'Warning',
        text: 'Please review this action.',
        level: 'warning'
      },
      {
        id: 3,
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        level: 'error'
      }
    ],
    removeNotification: mockRemoveNotification
  },
};

export const WithCloseAction = {
  args: {
    notifications: [
      {
        id: Date.now(),
        title: 'Closeable Notification',
        text: 'Click the × button to close this notification.',
        level: 'info'
      }
    ],
    removeNotification: (id) => {
      alert(`Notification ${id} would be removed`);
    }
  },
};
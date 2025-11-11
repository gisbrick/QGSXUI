import Message from './Message';

export default {
  title: '04 - UI/Message',
  component: Message,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
    },
    onClose: { 
      control: false, // No mostrar control para onClose por defecto
      action: 'closed' 
    }
  },
};

export const Info = {
  args: {
    type: 'info',
    title: 'Information',
    message: 'This is an informational message.',
  },
};

export const Success = {
  args: {
    type: 'success',
    title: 'Success',
    message: 'Operation completed successfully!',
  },
};

export const Warning = {
  args: {
    type: 'warning',
    title: 'Warning',
    message: 'Please be careful with this action.',
  },
};

export const Error = {
  args: {
    type: 'error',
    title: 'Error',
    message: 'Something went wrong. Please try again.',
  },
};

// Ejemplo con botón de cerrar
export const WithCloseButton = {
  args: {
    type: 'info',
    title: 'Closeable Message',
    message: 'This message can be closed using the × button.',
    onClose: () => console.log('Message closed!')
  },
};

// Ejemplo usando children en lugar de message
export const WithChildren = {
  args: {
    type: 'warning',
    title: 'Custom Content',
    children: 'This message uses children instead of the message prop.',
  },
};
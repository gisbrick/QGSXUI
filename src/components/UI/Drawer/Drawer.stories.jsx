import Drawer from './Drawer';

export default {
  title: '04 - UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    isOpen: true,
    title: 'Drawer Title',
    children: 'Drawer content goes here...',
  },
};

export const Closed = {
  args: {
    isOpen: false,
    title: 'Drawer Title',
    children: 'This drawer is closed',
  },
};
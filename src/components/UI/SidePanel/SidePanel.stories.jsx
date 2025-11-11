import SidePanel from './SidePanel';

export default {
  title: '04 - UI/SidePanel',
  component: SidePanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    isOpen: true,
    title: 'Side Panel',
    children: 'Side panel content goes here...',
  },
};

export const Closed = {
  args: {
    isOpen: false,
    title: 'Side Panel',
    children: 'This panel is closed',
  },
};

export const WithActions = {
  args: {
    isOpen: true,
    title: 'Side Panel with Actions',
    children: (
      <div>
        <p>Panel content with actions</p>
        <button>Action 1</button>
        <button>Action 2</button>
      </div>
    ),
  },
};
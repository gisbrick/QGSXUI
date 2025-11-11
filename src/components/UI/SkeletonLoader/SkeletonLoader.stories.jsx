import SkeletonLoader from './SkeletonLoader';

export default {
  title: '04 - UI/SkeletonLoader',
  component: SkeletonLoader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['text', 'rectangular', 'circular'],
    },
  },
};

export const Text = {
  args: {
    variant: 'text',
    width: 200,
    height: 20,
  },
};

export const Rectangular = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};

export const Circular = {
  args: {
    variant: 'circular',
    width: 60,
    height: 60,
  },
};

export const Multiple = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <SkeletonLoader variant="text" width={250} height={20} />
      <SkeletonLoader variant="text" width={200} height={20} />
      <SkeletonLoader variant="rectangular" width={300} height={150} />
    </div>
  ),
};
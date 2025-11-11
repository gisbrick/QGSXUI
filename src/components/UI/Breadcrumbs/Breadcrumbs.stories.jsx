import Breadcrumbs from './Breadcrumbs';

export default {
  title: '04 - UI/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Category', href: '/products/category' },
      { label: 'Current Page' }
    ]
  },
};

export const SingleItem = {
  args: {
    items: [
      { label: 'Home' }
    ]
  },
};
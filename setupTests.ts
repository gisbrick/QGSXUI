import Breadcrumbs from './src/components/UI/Breadcrumbs/Breadcrumbs';
export default {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
};

const Template = (args) => <Breadcrumbs {...args} />;

export const Default = Template.bind({});
Default.args = {
  // default args here
};
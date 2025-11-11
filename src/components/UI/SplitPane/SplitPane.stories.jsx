import React from 'react';
import SplitPane from './SplitPane';

const meta = {
  title: '04 - UI/SplitPane',
  component: SplitPane,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'SplitPane component for creating resizable split layouts with drag and keyboard navigation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direction of the split (horizontal or vertical)',
    },
    initialSize: {
      control: 'text',
      description: 'Initial size of the first pane (percentage or pixels)',
    },
    minSize: {
      control: 'number',
      description: 'Minimum size of the first pane in pixels',
    },
    maxSize: {
      control: 'number',
      description: 'Maximum size of the first pane in pixels',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the split pane is disabled',
    },
    onResize: {
      action: 'resized',
      description: 'Callback function when the pane is resized',
    },
    children: {
      control: false,
      description: 'Two child elements to be placed in the split panes',
    },
  },
  args: {
    direction: 'horizontal',
    initialSize: '50%',
    minSize: 100,
    disabled: false,
  },
};

export default meta;

const PaneContent = ({ title, color }) => (
  <div style={{ 
    padding: '20px', 
    background: color, 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold'
  }}>
    {title}
  </div>
);

export const HorizontalSplit = {
  args: {
    direction: 'horizontal',
    initialSize: '50%',
  },
  render: (args) => (
    <div style={{ height: '400px', width: '100%' }}>
      <SplitPane {...args}>
        <PaneContent title="Left Pane" color="#1976d2" />
        <PaneContent title="Right Pane" color="#388e3c" />
      </SplitPane>
    </div>
  ),
};

export const VerticalSplit = {
  args: {
    direction: 'vertical',
    initialSize: '40%',
  },
  render: (args) => (
    <div style={{ height: '400px', width: '100%' }}>
      <SplitPane {...args}>
        <PaneContent title="Top Pane" color="#d32f2f" />
        <PaneContent title="Bottom Pane" color="#f57c00" />
      </SplitPane>
    </div>
  ),
};

export const WithMinMaxSize = {
  args: {
    direction: 'horizontal',
    initialSize: 200,
    minSize: 150,
    maxSize: 400,
    onResize: (size) => console.log('Resized to:', size),
  },
  render: (args) => (
    <div style={{ height: '400px', width: '100%' }}>
      <SplitPane {...args}>
        <PaneContent title="Left (150px - 400px)" color="#7b1fa2" />
        <PaneContent title="Right Pane" color="#5d4037" />
      </SplitPane>
    </div>
  ),
};

export const Disabled = {
  args: {
    direction: 'horizontal',
    initialSize: '30%',
    disabled: true,
  },
  render: (args) => (
    <div style={{ height: '400px', width: '100%' }}>
      <SplitPane {...args}>
        <PaneContent title="Fixed Left Pane" color="#616161" />
        <PaneContent title="Fixed Right Pane" color="#424242" />
      </SplitPane>
    </div>
  ),
};

export const CodeEditor = {
  args: {
    direction: 'horizontal',
    initialSize: '60%',
  },
  render: (args) => (
    <div style={{ height: '500px', width: '100%' }}>
      <SplitPane {...args}>
        <div style={{ padding: '10px', background: '#f5f5f5', height: '100%', overflow: 'auto' }}>
          <h3>Code Editor</h3>
          <pre style={{ background: '#2d2d2d', color: '#fff', padding: '10px', borderRadius: '4px' }}>
{`function HelloWorld() {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>This is a sample component.</p>
    </div>
  );
}`}
          </pre>
        </div>
        <div style={{ padding: '10px', background: '#fff', height: '100%', overflow: 'auto' }}>
          <h3>Preview</h3>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px' }}>
            <h1>Hello, World!</h1>
            <p>This is a sample component.</p>
          </div>
        </div>
      </SplitPane>
    </div>
  ),
};
import React from 'react';
import TreeView from './TreeView';

const meta = {
  title: '04 - UI/TreeView',
  component: TreeView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'TreeView component for displaying hierarchical data with keyboard navigation and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of tree nodes with hierarchical structure',
    },
    onSelect: {
      action: 'selected',
      description: 'Callback function when a node is selected',
    },
    selectedNode: {
      control: 'text',
      description: 'ID of the currently selected node',
    },
    defaultExpandedNodes: {
      control: 'object',
      description: 'Array of node IDs that should be expanded by default',
    },
  },
  args: {
    data: [
      {
        id: '1',
        label: 'Documents',
        icon: '📁',
        children: [
          { id: '1-1', label: 'Resume.pdf', icon: '📄' },
          { id: '1-2', label: 'Cover Letter.docx', icon: '📄' },
        ],
      },
      {
        id: '2',
        label: 'Pictures',
        icon: '🖼️',
        children: [
          { id: '2-1', label: 'Vacation.jpg', icon: '🖼️' },
          { id: '2-2', label: 'Family.png', icon: '🖼️' },
        ],
      },
    ],
    defaultExpandedNodes: [],
    selectedNode: null,
  },
};

export default meta;

const sampleData = [
  {
    id: '1',
    label: 'Documents',
    icon: '📁',
    children: [
      {
        id: '1-1',
        label: 'Work',
        icon: '📁',
        children: [
          { id: '1-1-1', label: 'Report.pdf', icon: '📄' },
          { id: '1-1-2', label: 'Presentation.pptx', icon: '📊' },
        ]
      },
      {
        id: '1-2',
        label: 'Personal',
        icon: '📁',
        children: [
          { id: '1-2-1', label: 'Photos', icon: '📁' },
          { id: '1-2-2', label: 'Notes.txt', icon: '📝' },
        ]
      }
    ]
  },
  {
    id: '2',
    label: 'Downloads',
    icon: '📁',
    children: [
      { id: '2-1', label: 'Software.zip', icon: '📦' },
      { id: '2-2', label: 'Image.jpg', icon: '🖼️' },
    ]
  },
  {
    id: '3',
    label: 'Desktop',
    icon: '📁',
  }
];

export const Default = {
  args: {
    data: sampleData,
  },
};

export const WithSelection = {
  args: {
    data: sampleData,
    selectedNode: '1-1-1',
    onSelect: (node) => console.log('Selected:', node),
  },
};

export const WithDefaultExpanded = {
  args: {
    data: sampleData,
    defaultExpandedNodes: ['1', '1-1'],
    selectedNode: '1-1-2',
  },
};

export const SimpleTree = {
  args: {
    data: [
      { id: 'a', label: 'Item A' },
      { id: 'b', label: 'Item B' },
      { id: 'c', label: 'Item C' },
    ],
  },
};

export const DeepNesting = {
  args: {
    data: [
      {
        id: 'root',
        label: 'Root',
        children: [
          {
            id: 'level1',
            label: 'Level 1',
            children: [
              {
                id: 'level2',
                label: 'Level 2',
                children: [
                  {
                    id: 'level3',
                    label: 'Level 3',
                    children: [
                      { id: 'level4', label: 'Level 4' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    defaultExpandedNodes: ['root', 'level1', 'level2', 'level3'],
  },
};
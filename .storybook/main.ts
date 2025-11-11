import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    // Fusionar la configuración de Vite con la de Storybook
    return mergeConfig(config, {
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    });
  },
  managerHead: (head) => {
    const style = `
    <style>
      .sidebar-header {
        position: relative;
        padding-bottom: 40px; /* espacio para el texto */
      }

      .sidebar-header::after {
        content: 'Librería Frontend QGSXUI';
        position: absolute;
        bottom: 8px;
        left: 16px;
        font-size: 14px;
        color: #5C6870;
        background-color: #F3F3F3;
        padding: 4px 8px;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        font-weight: 500;
      }
    </style>
  `;
    return `${head}\n${style}`;
  }
};
export default config;

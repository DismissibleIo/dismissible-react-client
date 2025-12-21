import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "msw-storybook-addon"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  async viteFinal(config) {
    // Set the MODE environment variable based on NODE_ENV or custom MODE
    const mode = process.env.MODE || process.env.NODE_ENV || 'development';
    
    return {
      ...config,
      mode,
      define: {
        ...config.define,
        'import.meta.env.MODE': JSON.stringify(mode),
      },
      build: {
        ...config.build,
        target: 'es2020', // Support BigInt literals
      },
    };
  },
};
export default config;
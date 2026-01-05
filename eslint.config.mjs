import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      storybook: storybook,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...(typescript.configs?.recommended?.rules || {}),
      // React recommended rules
      ...(react.configs?.recommended?.rules || {}),
      // React Hooks recommended rules
      ...(reactHooks.configs?.recommended?.rules || {}),
      // Storybook recommended rules
      ...(storybook.configs?.recommended?.rules || {}),
      // Custom overrides
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];


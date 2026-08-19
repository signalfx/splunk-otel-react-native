import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
  resolvePluginsRelativeTo: path.dirname(
    require.resolve('@react-native/eslint-config')
  ),
});

export default [
  ...fixupConfigRules(compat.extends('@react-native', 'prettier')),
  {
    plugins: { prettier },
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-dupe-class-members': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'lib/',
      'packages/**/lib/',
      'packages/**/plugin/build/',
      'packages/**/android/build/',
      '**/__tests__/**',
      '**/jest.setup.js',
      'dist/',
      'example/android/build/',
      'example/android/app/build/',
      'example/ios/build/',
      'example/ios/Pods/',
      'example/vendor/',
      'native-android-sdk/',
      'native-ios-sdk/',
      'packages/core/ios/frameworks/',
    ],
  },
];

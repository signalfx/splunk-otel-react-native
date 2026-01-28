const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sdk = path.resolve(root, 'packages', 'core'); // core package dir
const singletons = ['react', 'react-native'];

/** @type {import('@react-native/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// Block React/React Native from SDK's node_modules to prevent duplicate React
const escapedSdkPath = sdk.replace(/[/\\]/g, '[/\\\\]');
const sdkReactBlockList = new RegExp(
  `${escapedSdkPath}[/\\\\]node_modules[/\\\\](react|react-native)[/\\\\].*`
);

const config = {
  watchFolders: [sdk],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    extraNodeModules: singletons.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
    blockList: [sdkReactBlockList],
  },
};

module.exports = mergeConfig(defaultConfig, config);

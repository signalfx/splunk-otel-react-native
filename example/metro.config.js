const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const corePackage = path.resolve(root, 'packages', 'core');
const sessionReplayPackage = path.resolve(root, 'packages', 'session-replay');
const singletons = ['react', 'react-native'];

/** @type {import('@react-native/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// Block React/React Native from SDK packages' node_modules to prevent duplicates
function buildBlockList(pkgPath) {
  const escaped = pkgPath.replace(/[/\\]/g, '[/\\\\]');
  return new RegExp(
    `${escaped}[/\\\\]node_modules[/\\\\](react|react-native)[/\\\\].*`
  );
}

const config = {
  watchFolders: [corePackage, sessionReplayPackage],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    extraNodeModules: singletons.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
    blockList: [
      buildBlockList(corePackage),
      buildBlockList(sessionReplayPackage),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);

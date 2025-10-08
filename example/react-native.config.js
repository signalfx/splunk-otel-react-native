const path = require('path');
const sdkName = '@splunk/otel-react-native';

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [sdkName]: {
      root: path.join(__dirname, '..', 'packages', 'core'),
      platforms: {
        // Codegen script incorrectly fails without this
        // So we explicitly specify the platforms with empty object
        ios: {},
        android: {},
      },
    },
  },
};

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const def = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...def.resolver.assetExts, 'sqlite3'],
  },
};

module.exports = mergeConfig(def, config);

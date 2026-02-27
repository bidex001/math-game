const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// keep the bundler focused on your app
config.watchFolders = [];
config.resolver.blockList = [/fdroiddata\/.*$/, /repo\/.*$/, /metadata\/.*$/];

module.exports = config;

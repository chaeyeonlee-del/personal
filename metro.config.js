const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;
const noEvalFetchThenEvalPath = path.resolve(__dirname, 'src/platform/noEvalFetchThenEvalJs.js');
const noEvalUuidPath = path.resolve(__dirname, 'src/platform/noEvalUuid.web.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const normalizedModuleName = moduleName.replace(/\\/g, '/');
  const isExpoModulesCoreSource = context.originModulePath.includes(
    `${path.sep}expo-modules-core${path.sep}src${path.sep}`
  );

  if (
    (moduleName === './fetchThenEval' ||
      moduleName === './fetchThenEval.web' ||
      moduleName === './fetchThenEvalJs') &&
    context.originModulePath.includes(`${path.sep}expo${path.sep}src${path.sep}async-require${path.sep}`)
  ) {
    return {
      type: 'sourceFile',
      filePath: noEvalFetchThenEvalPath,
    };
  }

  if (
    platform === 'web' &&
    ((isExpoModulesCoreSource &&
      (normalizedModuleName === './uuid' ||
        normalizedModuleName === '../uuid/index.web' ||
        normalizedModuleName.endsWith('/uuid/index.web'))) ||
      normalizedModuleName === 'expo-modules-core/src/uuid' ||
      normalizedModuleName === 'expo-modules-core/src/uuid/index.web')
  ) {
    return {
      type: 'sourceFile',
      filePath: noEvalUuidPath,
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

// Config de monorepo -- sem isto o Metro nao resolve @onyx/core.
// Ver: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. observa toda a workspace, para hot reload em packages/core
config.watchFolders = [workspaceRoot];

// 2. resolve modulos do app e depois da raiz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. impede o Metro de subir a arvore por conta propria e pegar
//    uma copia duplicada de react/react-native
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// Required for @clerk/expo subpath imports (e.g. @clerk/react/internal)
config.resolver.unstable_enablePackageExports = true

// Workspace packages (e.g. @casalux/utils) use .js extensions in TS imports.
// Remap them to .ts so Metro can find the source files.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js')) {
    for (const ext of ['.ts', '.tsx']) {
      try {
        return context.resolveRequest(
          context,
          moduleName.slice(0, -3) + ext,
          platform,
        )
      } catch {}
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })

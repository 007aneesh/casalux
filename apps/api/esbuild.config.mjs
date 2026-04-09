/**
 * esbuild bundler for the Vercel serverless function.
 *
 * Bundles src/vercel-entry.ts (and all workspace/npm deps) into api/index.js
 * so @vercel/node never has to resolve .ts workspace packages at runtime.
 *
 * Native binary handling:
 *   - File-path requires  (e.g. require('./libquery_engine-rhel-…so.node'))
 *     → kept external; the binaries are copied next to the bundle below.
 *   - Package-path requires (e.g. require('apache-arrow/Arrow.node'))
 *     → stubbed with an empty module so the pure-JS fallback is used.
 *     These are optional perf addons (Apache Arrow, etc.) that ship a JS impl.
 */

import { build } from 'esbuild'
import { cpSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prismaClientDir = resolve(__dirname, '../../packages/db/generated/prisma-client')
const outDir = resolve(__dirname, 'api')

/** esbuild plugin: routes .node requires correctly */
const nativeModulesPlugin = {
  name: 'native-modules',
  setup(build) {
    // Relative/absolute file-path requires (./foo.node, /abs/foo.node)
    // — keep external; the actual binary will be on disk at runtime.
    build.onResolve({ filter: /^[./].*\.node$/ }, args => ({
      path: args.path,
      external: true,
    }))

    // Package-path requires (apache-arrow/Arrow.node, leveldown/prebuilds/…)
    // — stub with an empty CommonJS module so the pure-JS fallback is used.
    build.onResolve({ filter: /^[^./].*\.node$/ }, args => {
      console.log(`[native-modules] stubbing package-native require: ${args.path}`)
      return { path: args.path, namespace: 'native-stub' }
    })

    build.onLoad({ filter: /.*/, namespace: 'native-stub' }, () => ({
      contents: 'module.exports = {}',
      loader: 'js',
    }))
  },
}

await build({
  entryPoints: ['src/vercel-entry.ts'],
  bundle: true,
  platform: 'node',
  target: ['node20'],
  format: 'esm',
  outfile: 'api/index.js',
  plugins: [nativeModulesPlugin],
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
  // Prisma's generated client is CommonJS and uses __dirname / require.
  // Inject CJS compatibility shims at the top of the ESM bundle.
  banner: {
    js: [
      '// esbuild bundle — do not edit directly.',
      'import { createRequire } from "module";',
      'import { fileURLToPath } from "url";',
      'import { dirname } from "path";',
      'const require = createRequire(import.meta.url);',
      'const __filename = fileURLToPath(import.meta.url);',
      'const __dirname = dirname(__filename);',
    ].join('\n'),
  },
})

// Copy Prisma native binaries and schema.prisma next to the bundle so that
// Prisma's __dirname-based engine lookup succeeds at runtime.
const filesToCopy = [
  'libquery_engine-rhel-openssl-1.0.x.so.node',
  'libquery_engine-rhel-openssl-3.0.x.so.node',
  'libquery_engine-debian-openssl-1.1.x.so.node',
  'libquery_engine-debian-openssl-3.0.x.so.node',
  'schema.prisma',
]

mkdirSync(outDir, { recursive: true })
for (const file of filesToCopy) {
  const src = resolve(prismaClientDir, file)
  const dest = resolve(outDir, file)
  try {
    cpSync(src, dest)
    console.log(`[esbuild] copied ${file}`)
  } catch {
    console.warn(`[esbuild] skipped ${file} (not found — likely wrong platform)`)
  }
}

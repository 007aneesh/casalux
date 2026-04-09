/**
 * esbuild bundler for the Vercel serverless function.
 *
 * Bundles api/index.ts (and all workspace packages) into a single
 * api/index.js file so @vercel/node never has to resolve .ts workspace
 * packages at runtime.
 *
 * Only *.node native binaries are kept external — they are copied next to
 * the bundle by the postbuild step in package.json so Prisma's __dirname
 * resolution finds them.
 */

import { build } from 'esbuild'
import { cpSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prismaClientDir = resolve(__dirname, '../../packages/db/generated/prisma-client')
const outDir = resolve(__dirname, 'api')

await build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  target: ['node20'],
  format: 'esm',
  outfile: 'api/index.js',
  // Native binaries cannot be bundled — keep them external so Node.js
  // loads them via require() at runtime from the same directory.
  external: ['*.node'],
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
  // Suppress Prisma's "missing peer dependency" warning spam.
  banner: {
    js: [
      '// esbuild bundle — do not edit directly.',
      'import { createRequire } from "module";',
      'const require = createRequire(import.meta.url);',
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

/**
 * Polyfill for React.cache which is only available in React 19 / Next.js RSC runtime.
 * SWR v2+ calls React.cache() in its react-server entry point. Without this polyfill,
 * the build fails with "n.cache is not a function" when Next.js collects static page data.
 */
const React = require('react')

if (typeof React.cache !== 'function') {
  // Stub: React.cache(fn) returns fn (no-op caching, safe for client-side SWR usage)
  React.cache = function (fn) {
    return fn
  }
}

module.exports = React

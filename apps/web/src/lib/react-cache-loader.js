/**
 * Webpack loader that patches React.cache into the React CJS production bundle.
 * React.cache was added in React 19 / Next.js's canary React build.
 * Next.js's patchFetch() calls React.cache() at module init time, which fails
 * in React 18.3.1 stable. This polyfill provides a safe no-op fallback.
 */
module.exports = function reactCacheLoader(source) {
  return source + '\n;if(typeof exports.cache!=="function"){exports.cache=function(fn){return fn};}';
}

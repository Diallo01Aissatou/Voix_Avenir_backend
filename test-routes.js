const { pathToRegexp } = require('path-to-regexp');

const routes = [
  '/uploads/(.*)',
  '/uploads/(.+)',
  '/uploads/:path(.*)',
  '/uploads/{*splat}',
  '/uploads/*'
];

for (const route of routes) {
  try {
    pathToRegexp(route);
    console.log(`✅ ${route}`);
  } catch (err) {
    console.error(`❌ ${route} -> ${err.message}`);
  }
}

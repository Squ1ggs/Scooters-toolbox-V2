/**
 * Patch index.html for GitHub Pages: point server stats to your PHP host (CORS),
 * and set canonical / og:url / JSON-LD to the GitHub Pages URL.
 *
 * Usage: node scripts/patch-index-for-github-pages.mjs <path-to-index.html>
 * Env:
 *   GHPAGES_SITE_URL   - e.g. https://YOURUSER.github.io/REPO/
 *   STX_SHARED_API_BASE - e.g. https://save-editor.be/Scooters_TBX (no trailing slash ok)
 */
import fs from 'fs';
import path from 'path';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/patch-index-for-github-pages.mjs <index.html>');
  process.exit(1);
}

const site = (process.env.GHPAGES_SITE_URL || 'https://example.github.io/Scooters-toolbox-V2/').replace(/\/?$/, '/');
const shared = (process.env.STX_SHARED_API_BASE || 'https://save-editor.be/Scooters_TBX').replace(/\/+$/, '');

let html = fs.readFileSync(file, 'utf8');

function rep(attr, name, value) {
  const re = new RegExp(`<meta content="[^"]*" name="${name}"\\/>`, 'g');
  const n = (html.match(re) || []).length;
  if (n !== 1) {
    console.warn(`patch: expected 1 meta name="${name}", found ${n}`);
  }
  html = html.replace(re, `<meta content="${value}" name="${name}"/>`);
}

rep('content', 'stx-analytics-endpoint', `${shared}/track.php`);
rep('content', 'stx-counter-url', `${shared}/counter_v2.php`);
rep('content', 'stx-items-bump-url', `${shared}/items-bump.php`);
rep('content', 'stx-php-counter-url', `${shared}/counter_v2.php`);

html = html.replace(
  /<link href="https:\/\/scooters-toolbox\.netlify\.app\/" rel="canonical"\/>/,
  `<link href="${site}" rel="canonical"/>`
);
html = html.replace(
  /<meta content="https:\/\/scooters-toolbox\.netlify\.app\/" property="og:url"\/>/,
  `<meta content="${site}" property="og:url"/>`
);

html = html.replace(
  /"url":"https:\/\/scooters-toolbox\.netlify\.app\/"/g,
  `"url":"${site.replace(/\/$/, '')}/"`
);

fs.writeFileSync(file, html, 'utf8');
console.log('Patched', path.resolve(file));
console.log('  site:', site);
console.log('  shared API:', shared);

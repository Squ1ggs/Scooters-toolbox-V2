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

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rep(name, value) {
  const esc = escapeRe(name);
  const replacement = `<meta content="${value}" name="${name}"/>`;
  const p1 = new RegExp(`<meta content="[^"]*" name="${esc}"\\s*/>`, 'g');
  const p2 = new RegExp(`<meta name="${esc}" content="[^"]*"\\s*/>`, 'g');
  const before = html;
  html = html.replace(p1, replacement);
  if (html !== before) return;
  html = html.replace(p2, replacement);
  if (html === before) {
    console.warn(`patch: no meta name="${name}" matched (content-first or name-first)`);
  }
}

rep('stx-analytics-endpoint', `${shared}/track.php`);
rep('stx-counter-url', `${shared}/counter_v2.php`);
rep('stx-items-bump-url', `${shared}/items-bump.php`);
rep('stx-php-counter-url', `${shared}/counter_v2.php`);

const siteNoSlash = site.replace(/\/$/, '');
const canonicalLink = `<link href="${site}" rel="canonical"/>`;
html = html.replace(/<link\s+href="[^"]*"\s+rel="canonical"\s*\/>/i, canonicalLink);
html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, canonicalLink);

html = html.replace(
  /<meta\s+content="[^"]*"\s+property="og:url"\s*\/>/i,
  `<meta content="${site}" property="og:url"/>`
);
html = html.replace(
  /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i,
  `<meta content="${site}" property="og:url"/>`
);

/* Single WebApplication url in JSON-LD — rewrite any previous host (Netlify, bad custom domain, etc.). */
html = html.replace(/"url":"https?:\/\/[^"]*"/, `"url":"${siteNoSlash}/"`);

fs.writeFileSync(file, html, 'utf8');
console.log('Patched', path.resolve(file));
console.log('  site:', site);
console.log('  shared API:', shared);

/**
 * Patch HTML for GitHub Pages: point STX metas to shared PHP (CORS),
 * and set canonical / og:url / JSON-LD to the GitHub Pages URL where present.
 *
 * Usage:
 *   node scripts/patch-index-for-github-pages.mjs _site/index.html
 *   node scripts/patch-index-for-github-pages.mjs _site
 * Env:
 *   GHPAGES_SITE_URL   - e.g. https://YOURUSER.github.io/REPO/
 *   STX_SHARED_API_BASE - e.g. https://save-editor.be/Scooters_TBX (no trailing slash ok)
 */
import fs from 'fs';
import path from 'path';

const site = (process.env.GHPAGES_SITE_URL || 'https://example.github.io/Scooters-toolbox-V2/').replace(/\/?$/, '/');
const shared = (process.env.STX_SHARED_API_BASE || 'https://save-editor.be/Scooters_TBX').replace(/\/+$/, '');

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkHtmlFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, out);
    else if (ent.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}

function shouldPatchHtml(html) {
  return (
    html.includes('stx-analytics-endpoint') ||
    html.includes('stx-counter-url') ||
    html.includes('scooters-toolbox.netlify.app')
  );
}

function patchHtmlString(html) {
  function rep(name, value, optional) {
    const esc = escapeRe(name);
    const replacement = `<meta content="${value}" name="${name}"/>`;
    const p1 = new RegExp(`<meta content="[^"]*" name="${esc}"\\s*/>`, 'g');
    const p2 = new RegExp(`<meta name="${esc}" content="[^"]*"\\s*/>`, 'g');
    const before = html;
    html = html.replace(p1, replacement);
    if (html !== before) return;
    html = html.replace(p2, replacement);
    if (html === before && !optional) {
      console.warn(`patch: no meta name="${name}" matched (content-first or name-first)`);
    }
  }

  rep('stx-analytics-endpoint', `${shared}/track.php`);
  rep('stx-counter-url', `${shared}/counter_v2.php`);
  rep('stx-items-bump-url', `${shared}/items-bump.php`);
  rep('stx-php-counter-url', `${shared}/counter_v2.php`, true);

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

  html = html.replace(/"url":"https?:\/\/[^"]*"/, `"url":"${siteNoSlash}/"`);

  return html;
}

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!shouldPatchHtml(html)) return false;
  const next = patchHtmlString(html);
  if (next === html) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/patch-index-for-github-pages.mjs <index.html | _site-dir>');
  process.exit(1);
}

const targets = [];
for (const arg of args) {
  if (!fs.existsSync(arg)) {
    console.error('Not found:', arg);
    process.exit(1);
  }
  const st = fs.statSync(arg);
  if (st.isDirectory()) targets.push(...walkHtmlFiles(arg));
  else targets.push(arg);
}

let n = 0;
for (const f of targets) {
  if (patchFile(f)) {
    console.log('Patched', path.resolve(f));
    n++;
  }
}
if (!n) console.log('No files needed STX/GitHub Pages patches (or none matched).');
console.log('  site:', site);
console.log('  shared API:', shared);
console.log('  files updated:', n);

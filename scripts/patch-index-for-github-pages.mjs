/**
 * Patch static site artifact for GitHub Pages / mirror hosts:
 * - STX analytics/counter metas → PHP host (STX_SHARED_API_BASE)
 * - canonical / og:url / JSON-LD / sitemap / robots → primary SEO host
 *   (default https://scooterstoolbox.com) so mirrors do not compete in Google
 *
 * Usage:
 *   node scripts/patch-index-for-github-pages.mjs _site
 * Env:
 *   SEO_CANONICAL_HOST  - e.g. https://scooterstoolbox.com
 *   STX_SHARED_API_BASE - e.g. https://scooterstoolbox.com
 *   GHPAGES_SITE_URL    - optional (informational only; not used for SEO)
 */
import fs from 'fs';
import path from 'path';

const primary = (process.env.SEO_CANONICAL_HOST || process.env.PRIMARY_SITE_URL || 'https://scooterstoolbox.com')
  .replace(/\/?$/, '/');
const primaryNoTrail = primary.replace(/\/$/, '');
const shared = (process.env.STX_SHARED_API_BASE || primaryNoTrail).replace(/\/+$/, '');
const pagesUrl = (process.env.GHPAGES_SITE_URL || '').replace(/\/?$/, '/');

/**
 * Mirror / legacy hosts whose SEO absolute URLs must become the primary host.
 * Do NOT include the primary host itself.
 */
const SEO_FROM_BASES = [
  'https://save-editor.be/Scooters_TBX',
  'https://scooters-toolbox.netlify.app',
  'https://Squ1ggs.github.io/Scooters-toolbox-V2',
  'https://squ1ggs.github.io/Scooters-toolbox-V2',
  'https://www.scooterstoolbox.com',
];

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

function repMeta(html, name, value, optional) {
  const esc = escapeRe(name);
  const already =
    html.includes(`name="${name}"`) &&
    (html.includes(`content="${value}"`) || html.includes(`content='${value}'`));
  if (already) return html;
  const replacement = `<meta content="${value}" name="${esc}"/>`;
  const p1 = new RegExp(`<meta content="[^"]*" name="${esc}"\\s*/?>`, 'g');
  const p2 = new RegExp(`<meta name="${esc}" content="[^"]*"\\s*/?>`, 'g');
  const before = html;
  html = html.replace(p1, replacement);
  if (html !== before) return html;
  html = html.replace(p2, replacement);
  if (html === before && !optional) {
    console.warn(`patch: no meta name="${name}" matched`);
  }
  return html;
}

/** Rewrite SEO absolute URLs for a single from-base → primary canonical host. */
function patchSeoFromBase(html, fromBase) {
  const from = escapeRe(fromBase.replace(/\/$/, ''));
  const repl = (suffix = '') => primaryNoTrail + suffix;

  html = html.replace(
    new RegExp(`<link href="${from}([^"]*)" rel="canonical"\\s*/>`, 'g'),
    (_, suffix) => `<link href="${repl(suffix)}" rel="canonical"/>`
  );
  html = html.replace(
    new RegExp(`<link rel="canonical" href="${from}([^"]*)"\\s*/>`, 'g'),
    (_, suffix) => `<link rel="canonical" href="${repl(suffix)}"/>`
  );
  html = html.replace(
    new RegExp(`<meta content="${from}([^"]*)" property="og:url"\\s*/>`, 'g'),
    (_, suffix) => `<meta content="${repl(suffix)}" property="og:url"/>`
  );
  html = html.replace(
    new RegExp(`<meta property="og:url" content="${from}([^"]*)"\\s*/>`, 'g'),
    (_, suffix) => `<meta property="og:url" content="${repl(suffix)}"/>`
  );
  html = html.replace(
    new RegExp(`"url":"${from}/?"`, 'g'),
    `"url":"${primaryNoTrail}/"`
  );
  return html;
}

function patchSeoUrls(html) {
  for (const base of SEO_FROM_BASES) {
    html = patchSeoFromBase(html, base);
  }
  return html;
}

function patchHtmlString(html) {
  html = repMeta(html, 'stx-analytics-endpoint', `${shared}/track.php`);
  html = repMeta(html, 'stx-counter-url', `${shared}/counter_v2.php`);
  html = repMeta(html, 'stx-items-bump-url', `${shared}/items-bump.php`);
  html = repMeta(html, 'stx-php-counter-url', `${shared}/counter_v2.php`, true);
  return patchSeoUrls(html);
}

function patchHtmlFile(filePath) {
  const before = fs.readFileSync(filePath, 'utf8');
  const next = patchHtmlString(before);
  if (next === before) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

function rewriteSeoBasesInText(text) {
  let next = text;
  for (const base of SEO_FROM_BASES) {
    const bare = base.replace(/\/$/, '');
    next = next.split(bare).join(primaryNoTrail);
  }
  return next;
}

function patchSitemap(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const before = fs.readFileSync(filePath, 'utf8');
  let next = rewriteSeoBasesInText(before);
  /* Ensure primary host URLs even if source already used a different www form */
  next = next.split('https://www.scooterstoolbox.com').join(primaryNoTrail);
  if (next === before) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

function patchRobots(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let text = fs.readFileSync(filePath, 'utf8');
  const before = text;
  text = rewriteSeoBasesInText(text);
  text = text.replace(/^Sitemap:.*$/m, `Sitemap: ${primaryNoTrail}/sitemap.xml`);
  if (!/^Sitemap:/m.test(text)) {
    text = text.replace(/\s*$/, `\n\nSitemap: ${primaryNoTrail}/sitemap.xml\n`);
  }
  text = text.replace(
    /^# If you move to a custom domain.*$/m,
    '# Mirror deploy: Sitemap points at the primary SEO host (scooterstoolbox.com).'
  );
  text = text.replace(
    /^# GitHub Pages sitemap.*$/m,
    '# Mirror deploy: Sitemap points at the primary SEO host (scooterstoolbox.com).'
  );
  if (text === before) return false;
  fs.writeFileSync(filePath, text, 'utf8');
  return true;
}

function stripLiveOnlyPacks(siteDir) {
  let n = 0;
  for (const rel of ['assets/sdk-mods.html', 'assets/data/appearance-packs.json']) {
    const file = path.join(siteDir, rel);
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
      console.log('Removed live-only', rel);
      n++;
    }
  }
  const packsDir = path.join(siteDir, 'assets', 'packs');
  if (fs.existsSync(packsDir)) {
    fs.rmSync(packsDir, { recursive: true, force: true });
    console.log('Removed live-only assets/packs');
    n++;
  }
  for (const file of walkHtmlFiles(siteDir)) {
    const before = fs.readFileSync(file, 'utf8');
    const next = before.replace(/<a\b[^>]*\bstx-live-only-packs\b[^>]*>[\s\S]*?<\/a>\s*/g, '');
    if (next !== before) {
      fs.writeFileSync(file, next, 'utf8');
      console.log('Removed packs link', path.relative(siteDir, file));
      n++;
    }
  }
  const sitemap = path.join(siteDir, 'sitemap.xml');
  if (fs.existsSync(sitemap)) {
    const before = fs.readFileSync(sitemap, 'utf8');
    const next = before.replace(/\s*<url>\s*<loc>[^<]*\/packs\/<\/loc>[\s\S]*?<\/url>/g, '');
    if (next !== before) {
      fs.writeFileSync(sitemap, next, 'utf8');
      console.log('Removed packs URL from sitemap');
      n++;
    }
  }
  return n;
}

function patchSiteDir(siteDir) {
  let n = stripLiveOnlyPacks(siteDir);
  for (const f of walkHtmlFiles(siteDir)) {
    if (patchHtmlFile(f)) {
      console.log('Patched HTML', path.relative(siteDir, f));
      n++;
    }
  }
  if (patchSitemap(path.join(siteDir, 'sitemap.xml'))) {
    console.log('Patched sitemap.xml');
    n++;
  }
  if (patchRobots(path.join(siteDir, 'robots.txt'))) {
    console.log('Patched robots.txt');
    n++;
  }
  return n;
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/patch-index-for-github-pages.mjs <_site-dir | file.html>');
  process.exit(1);
}

let total = 0;
for (const arg of args) {
  if (!fs.existsSync(arg)) {
    console.error('Not found:', arg);
    process.exit(1);
  }
  const st = fs.statSync(arg);
  if (st.isDirectory()) total += patchSiteDir(arg);
  else if (patchHtmlFile(arg)) total++;
}

if (!total) console.log('No GitHub Pages patches applied (source may already match primary + API).');
console.log('  SEO canonical host:', primaryNoTrail);
console.log('  shared API:', shared);
if (pagesUrl) console.log('  Pages mirror URL (not used for SEO):', pagesUrl.replace(/\/$/, ''));
console.log('  files updated:', total);

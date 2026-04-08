# GitHub Pages for Scooter’s Toolbox

GitHub Pages only serves **static** files. PHP (`counter_v2.php`, etc.) is **not** executed on `github.io`. This repo uses **GitHub Actions** to publish a trimmed copy of the site and patch `index.html` so counters/track/items-bump call your **shared host** (CORS must allow `https://YOURUSER.github.io` — your PHP scripts already send `Access-Control-Allow-Origin: *`).

## One-time setup

1. Push this repo to GitHub (branch `main`).
2. Repo **Settings → Pages**.
3. **Build and deployment → Source:** **GitHub Actions** (not “Deploy from branch”).
4. Run the workflow: **Actions → Deploy GitHub Pages → Run workflow**, or push to `main`.

The site will be at:

`https://<your-username>.github.io/<repository-name>/`

## Change shared API base path

If your toolbox is not under `https://save-editor.be/Scooters_TBX`, edit `.github/workflows/deploy-github-pages.yml`:

```yaml
STX_SHARED_API_BASE: https://your-host.example/path/to/toolbox
```

(no trailing slash required)

## Local test of the patch

```bash
mkdir -p _site && cp index.html _site/
export GHPAGES_SITE_URL=https://you.github.io/Scooters-toolbox-V2/
export STX_SHARED_API_BASE=https://save-editor.be/Scooters_TBX
node scripts/patch-index-for-github-pages.mjs _site/index.html
```

Then serve `_site` with any static server and open `http://localhost:.../`.

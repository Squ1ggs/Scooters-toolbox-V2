# `references/json` (Nexus-Data dumps)

## Does the web app load all of these at runtime?

**No.** The toolbox pages use bundled data such as:

- `assets/data/stx_dataset.js` — parts, manifests, embedded tables
- `assets/data/parts_stats_data.js` — `PARTS_STATS_DATA` for numeric stat rows (from Excel / pipeline)
- Optional ZIP / `ZIP_WEAPON_PARTS` for extra stat text

Only a **small fixed set** of Nexus JSON files under `references/json/` are read by **Node extract scripts** (not by the browser). The exact filenames are in **`tools/required-nexus-files.json`**; see **`references/REQUIRED_NEXUS_JSON.md`** in this repo for what each file feeds. To copy them out of a full NcsParser dump, run **`node tools/copy-required-nexus-json.js "<path-to-output/json>"`** (or `tools/copy-required-nexus-json.ps1`). Everything else was trimmed as unnecessary for this repo.

**Scooter’s Toolbox Rebuild** also loads (at runtime) bundled **`assets/data/weapon_stats_data.js`** (same idea as Legit Builder’s barrel/mag manufacturer init tables). That file is **not** part of `references/json`.

## Do you need `references/json` at all?

- **To use the toolbox in a browser:** no — bundled `assets/data/*` is enough.
- **To re-run extract scripts** (`scripts/extract_classmod_manifest.mjs`, `scripts/extract_legit_schedule.mjs`, `build-source-paths-data.js` at `rebuild of stx` root): yes — keep the files listed in **`references/REQUIRED_NEXUS_JSON.md`**.

## Workflow

1. Place the required Nexus files under `donerebuildstx/references/json/` (see manifest).
2. Run the script → update the generated file under `assets/data/`.
3. Ship **built** assets only; the raw Nexus JSONs are optional for end users.

## Using a full NcsParser / Gibbed `output/json` dump

The browser does **not** load hundreds of Nexus files. For a new dump (e.g. `Borderlands-4.NcsParser/output/json`):

1. Copy only the **`Nexus-Data-gbx_ue_data_table*.json`** (and any other files listed in `references/REQUIRED_NEXUS_JSON.md`) into `references/json/` — not the whole 900+ file folder. Use **`tools/copy-required-nexus-json.js`** from the **`rebuild of stx`** directory (or **`tools/copy-nexus-json.cmd`** with the full path — works from any working directory). See `references/REQUIRED_NEXUS_JSON.md`.
2. Re-run extracts: **`tools/run-data-extracts.cmd`** (8 steps: Nexus-derived `assets/data/*`, **`assets/js/stx-bulk-decoder-deps.js`**, prefix `*_data.js` when Python is available — see `references/REQUIRED_NEXUS_JSON.md` and `scripts/DATA_PIPELINE.txt`).
3. **`assets/data/part_ref_meta.js`** holds optional per-id metadata (`PART_REF_META`) for Advanced Part Search (e.g. notes). Regenerate with `node scripts/merge_part_ref_from_nexus.mjs`.

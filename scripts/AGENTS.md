# SCRIPTS KNOWLEDGE BASE

## OVERVIEW
`scripts/` contains operational build/release utilities that glue app build, docs build, env generation, tagging, and maintenance tasks.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Unified app+docs build | `scripts/build-all.js` | Runs app build, docs build, then copies docs to `dist/wiki/` |
| Runtime env bundle generation | `scripts/generate-env-config.js` | Writes `dist/env-config.js` from `VITE_*` vars |
| Release tagging flow | `scripts/auto_tag.js` | Used by `npm run release` |
| Release cleanup helper | `scripts/cleanup-releases.mjs` | Retention/cleanup automation |
| Asset refresh utilities | `scripts/fetchAbilities.cjs`, `scripts/update_abilities.cjs` | Static data refresh tooling |
| Asset upload utility | `scripts/upload_playercards_to_oss.js` | Upload script for player cards |

## CONVENTIONS
- Keep scripts idempotent where possible and fail fast on missing prerequisites.
- Use explicit logging for step boundaries in multi-stage scripts.
- Keep scripts aligned with workflow usage in `.github/workflows/`.
- Preserve Node ESM/CJS style per file extension (`.js/.mjs` vs `.cjs`).

## ANTI-PATTERNS
- Editing build scripts without checking their workflow callers in `.github/workflows/`.
- Writing scripts that silently ignore failure while CI expects hard failure.
- Duplicating env-generation logic across multiple scripts instead of reusing established flow.
- Treating one-off maintenance scripts as runtime app code paths.

## NOTES
- `npm run build` already invokes `scripts/generate-env-config.js`; `build-all.js` invokes it again in unified flow.
- Unified deploy pipelines rely on `build:all` for docs availability under `/wiki/`.

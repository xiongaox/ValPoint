# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-24 17:58 +0800
**Branch:** main

## OVERVIEW
ValPoint is a Vite + React + TypeScript MPA app with a co-deployed VitePress docs site (`/wiki/`), backed by Supabase.

## STRUCTURE
```text
ValPoint/
├── src/                  # app source: mpa shells + feature logic + services/lib
├── docs/                 # VitePress docs site
├── public/               # static gameplay/media assets (large)
├── scripts/              # build/release helper scripts
├── .github/workflows/    # release/docker/deploy automation
├── index.html            # shared library entry html
├── user.html             # personal library entry html
├── admin.html            # admin entry html
└── 404.html              # not found entry html
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add/adjust app entry | `vite.config.ts`, `index.html`, `user.html`, `admin.html`, `404.html` | MPA mode with explicit rollup inputs |
| Shared/user/admin shell behavior | `src/apps/` | Keep entry files thin (render/init only) |
| Core lineup workflow | `src/features/lineups/` | Main view + controller composition |
| Reusable business hooks | `src/hooks/` | Business logic extraction target |
| Supabase table I/O | `src/services/` | Thin query wrappers + normalization |
| Upload/download/system helpers | `src/lib/` | Lower-level utilities used by features/apps |
| Runtime env behavior | `src/supabaseClient.ts`, `scripts/generate-env-config.js`, `docker-entrypoint.sh` | `window.__ENV__` first, then `import.meta.env` |
| Build/release pipeline | `scripts/build-all.js`, `.github/workflows/*.yml` | Tag-driven release/docker, separate VPS dist deploy |
| Contributor architecture docs | `docs/dev/技术架构.md`, `docs/dev/开发规范.md` | Ground truth for boundaries |

## CONVENTIONS
- `vite.config.ts` uses `appType: 'mpa'` and four html inputs; do not treat this as SPA.
- Dev docs run on VitePress and are proxied in app dev via `/wiki/`.
- Build behavior is split: `npm run build` builds app; `npm run build:all` builds app + docs and merges docs into `dist/wiki/`.
- TypeScript strict mode is enabled (`tsconfig.json`); avoid `any`, `@ts-ignore`, `@ts-nocheck`.
- No enforced formatter/linter scripts; follow `.editorconfig` and nearby style.

## ANTI-PATTERNS (THIS PROJECT)
- Do not place business logic, Supabase queries, or complex state directly in app entry files (`docs/dev/开发规范.md`).
- Do not mix UI rendering and business logic in one component; move logic to hooks/controllers.
- Do not invent test commands: there is no `npm test` script and no `*.test.*` / `*.spec.*` files.
- Do not assume runtime env only comes from Vite build-time vars; deployment uses `window.__ENV__` injection paths.

## UNIQUE STYLES
- Tailwind is loaded from CDN in html entry files; there is no `tailwind.config.*` in repo.
- Large static asset pools under `public/abilities`, `public/agents`, `public/maps/*` are content-heavy and not code modules.
- Release build workflow can dispatch `deploy-dist-to-vps.yml` after release artifact upload.

## COMMANDS
```bash
npm install
npm run dev
npm run docs:dev
npx tsc -p tsconfig.json --noEmit
npm run build
npm run build:all
```

## NOTES
- CI/Docker uses Node 20.
- `scripts/generate-env-config.js` writes `dist/env-config.js`; Docker entrypoint writes runtime `env-config.js` and `valpoint.json`.
- Hierarchical precedence: child `AGENTS.md` guidance overrides root guidance for files under that child directory.
- Use child AGENTS files for module-level details:
  - `src/AGENTS.md`
  - `src/apps/AGENTS.md`
  - `src/features/lineups/AGENTS.md`
  - `src/lib/AGENTS.md`
  - `src/services/AGENTS.md`
  - `docs/AGENTS.md`
  - `scripts/AGENTS.md`

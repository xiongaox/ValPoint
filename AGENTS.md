# Agents Guide (ValPoint)
ValPoint is a Vite + React + TypeScript app in **MPA** mode (multiple entry HTML files) with a VitePress docs site. Primary backend is Supabase.
No Cursor rules found (`.cursor/rules/` or `.cursorrules`). No Copilot instructions found (`.github/copilot-instructions.md`).

## Quick Commands
Package manager is **npm** (`package-lock.json`). Node **20** is used in CI/Docker.

```bash
# install
npm install
npm ci

# dev
npm run dev         # Vite on :3208
npm run docs:dev    # VitePress on :5173

# build / typecheck
npm run build       # tsc && vite build
npm run build:all   # main app + docs (scripts/build-all.js)
npx tsc -p tsconfig.json --noEmit

# preview
npm run preview
npm run docs:build
npm run docs:preview
```

Lint/format/tests:
- No lint/format scripts and no ESLint/Prettier/Biome config; follow `.editorconfig`.
- No test runner (`npm test` not defined). “Run a single test” is not supported in current repo state.

## Architecture / Boundaries
High-level layout:
- `src/apps/`: MPA shells (shared/user/admin). Keep entrypoints thin.
- `src/features/`: feature modules (feature UI + controllers).
- `src/components/`: shared UI components.
- `src/hooks/`: shared hooks (business logic lives here, not in app shells).
- `src/services/`: API wrappers (Supabase queries, normalization).
- `src/lib/`: lower-level utilities (upload/download, auth helpers).
- `docs/`: VitePress documentation.

MPA entrypoints:
- `index.html`, `user.html`, `admin.html`, `404.html` (see `vite.config.ts`).
- Entrypoints should only contain Providers, routing/view switching, and initialization.
- Do not place business logic / Supabase queries / complex state in app entry files.

Dev wiki:
- In dev, `/wiki/` is proxied from Vite to VitePress (see `vite.config.ts`).

## Code Style
Naming:
- Components: `PascalCase` (e.g. `LineupCard.tsx`).
- Hooks: `usePascalCase` (prefer named exports).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.

Imports (common convention from docs):
1) React 2) third-party 3) local components 4) local hooks 5) local utils/services 6) types (`import type`) 7) styles

TypeScript:
- `strict: true` in `tsconfig.json`; keep it green.
- Prefer explicit types at module boundaries (hook params/returns, service APIs, external IO).
- Avoid type suppression (`@ts-ignore`, `@ts-nocheck`) and `any`.
  - There are legacy exceptions (e.g. `src/components/EditorModal.tsx`); do not copy them into new code.

UI vs Logic separation:
- UI components should not contain complex business logic.
- Put business logic in hooks (`src/hooks/`) or feature controllers (`src/features/.../controllers/`).
- API calls belong in `src/services/` (thin wrappers, data normalization).

Error handling:
- Supabase calls: handle `{ data, error }` explicitly; services commonly `throw error;`.
- For async UI flows: `try/catch/finally`, and always clear loading flags in `finally`.
- Prefer user-facing errors via existing alert/toast patterns rather than silent failures.

Logging:
- Existing code uses `console.*` for debugging/ops; avoid adding noisy `console.log` in new code.

## Supabase / Env
- Env vars are read from `window.__ENV__` (runtime-injected) or `import.meta.env` (see `src/supabaseClient.ts`).
- Local dev vars: `.env.example`.
- Docker runtime writes `env-config.js` and `valpoint.json` via `docker-entrypoint.sh`.

## Docs / Source of Truth
- Dev conventions: `docs/dev/开发规范.md`.
- Architecture notes: `docs/dev/技术架构.md`.
- Project overview: `docs/dev/项目概览.md`.

## Formatting / Editor
- `.editorconfig` is the baseline: 2 spaces, LF, UTF-8, final newline.
- No formatter is enforced by tooling; keep diffs small and consistent with nearby code.

## Repo Scripts
Scripts live in `scripts/`:
- `scripts/build-all.js`: builds main app + docs into one `dist/`.
- `scripts/auto_tag.js`: tagging/release helper (used by `npm run release`).
- `scripts/update_abilities.cjs`, `scripts/fetchAbilities.cjs`: ability icon/name data refresh.

## CI / Release Notes
GitHub Actions (tag-driven):
- `/.github/workflows/release.yml`: `npm ci` then `npm run build`, then archives `dist/`.
- `/.github/workflows/docker-build.yml`: builds/pushes Docker image on tags.

Docker (prod):
- `Dockerfile` uses Node 20 builder and runs `npm run build:all`.
- `docker-entrypoint.sh` writes `env-config.js` (runtime `window.__ENV__`) and `valpoint.json`.
- Nginx serves the unified MPA on port `3208` and docs under `/wiki/`.

## Where To Put Code
- UI-only components: `src/components/`.
- Feature UI + controllers: `src/features/<feature>/...`.
- Cross-app business logic: `src/hooks/` (prefer small, focused hooks).
- Data access / Supabase queries: `src/services/` (thin wrappers, normalize results).
- Low-level helpers (IO, upload/download, image bed providers): `src/lib/`.
- Shared types: `src/types/` (and feature-local types if tightly scoped).

## Supabase Conventions
- Clients are created in `src/supabaseClient.ts` and read env from `window.__ENV__` first.
- Services should follow the `{ data, error }` pattern and either:
  - `throw error;` for callers to handle, or
  - return a safe fallback (`null`/`[]`) when the UX benefits from best-effort reads.
- If you return fallbacks, log with enough context to debug (but avoid noisy logs).

## Error Handling Expectations
- Async UI flows: `try/catch/finally`; never leave loading flags stuck on.
- Prefer user-facing errors via the repo's existing alert/toast patterns.
- Avoid empty catch blocks; either handle, rethrow, or surface a message.

## Type Safety Expectations
- Do not add `any`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` in new code.
- If you find legacy suppressions, do not expand their surface area.
- Prefer typed payloads at boundaries (Supabase rows, form payloads, service inputs/outputs).

## Verification Before Shipping
No test suite exists; rely on typecheck/build and manual smoke:

```bash
# fast correctness
npx tsc -p tsconfig.json --noEmit

# full build
npm run build

# run the app
npm run dev
```

## Tests (Current State)
- There are no `*.test.*` / `*.spec.*` files and no `test` script in `package.json`.
- “Run a single test” is not applicable until a test runner is added.

If you add a runner later (example only; not currently available):

```bash
# vitest example
npm run test
npx vitest run path/to/file.test.ts -t "test name"
```

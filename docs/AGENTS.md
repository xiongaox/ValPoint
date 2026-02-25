# DOCS KNOWLEDGE BASE

## OVERVIEW
`docs/` is a VitePress site co-deployed with the app under `/wiki/`, with separate audience tracks for end users and contributors.

## STRUCTURE
```text
docs/
├── .vitepress/      # VitePress config, theme, build cache/output
├── guide/           # user-facing documentation
├── dev/             # contributor/developer documentation
├── public/          # docs static assets (images/logo/plates)
├── plans/           # internal planning docs
└── index.md         # docs homepage
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Docs nav/sidebar/base path | `docs/.vitepress/config.ts` | `base: '/wiki/'` and sidebar routing |
| Contributor coding rules | `docs/dev/开发规范.md` | Entry-file and layering constraints |
| Architecture reference | `docs/dev/技术架构.md` | MPA + VitePress + Supabase overview |
| Deployment docs behavior | `docs/guide/部署指南.md` | Uses `npm run build:all` requirement |
| User onboarding flow | `docs/guide/快速开始.md`, `docs/guide/使用流程.md` | User-facing operations |
| Media assets for docs | `docs/public/` | Static files consumed by VitePress pages |

## CONVENTIONS
- Keep docs/app boundary explicit: docs site is VitePress, app is Vite MPA.
- Prefer `docs/dev/` for engineering constraints and `docs/guide/` for user operations.
- Keep `/wiki/` path assumptions consistent with `docs/.vitepress/config.ts` and `vite.config.ts` proxy behavior.
- Treat `.vitepress/cache` and `.vitepress/dist` as generated outputs, not source content.

## ANTI-PATTERNS
- Documenting SPA assumptions for app routing in this repo (app runs in MPA mode).
- Updating deploy docs to use `npm run build` only for full-site deploy scenarios where docs must be included.
- Mixing internal engineering rules into user-only guide pages without clear separation.
- Editing generated docs artifacts under `.vitepress/dist` instead of source markdown/config.

## NOTES
- App dev server proxies `/wiki/` to VitePress dev server; verify docs links against that path.
- Docs are merged into `dist/wiki/` by `scripts/build-all.js` during unified build.

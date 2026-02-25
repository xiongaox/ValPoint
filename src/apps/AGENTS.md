# APPS KNOWLEDGE BASE

## OVERVIEW
`src/apps/` holds MPA app shells for shared library, personal library, and admin console.

## STRUCTURE
```text
src/apps/
├── shared/   # shared library app
├── user/     # personal library app
└── admin/    # admin console app
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Shared app behavior | `src/apps/shared/SharedApp.tsx`, `src/apps/shared/useSharedController.ts` | Shared library orchestration |
| User app behavior | `src/apps/user/UserApp.tsx` | Personal library shell |
| Admin app behavior | `src/apps/admin/AdminApp.tsx`, `src/apps/admin/pages/` | Admin dashboards and operations |
| Entry rendering | `src/apps/*/main.tsx` | Render + preload only |
| Shared app local modules | `src/apps/shared/components/`, `src/apps/shared/logic/` | App-local ui + logic split |

## CONVENTIONS
- Keep `main.tsx` files limited to preload/render/bootstrap.
- Move non-trivial logic to controllers/hooks, not app shell JSX.
- Keep app-local components inside the app folder unless reused cross-app.
- Preserve role boundaries: admin code in `admin/`, user/shared flows in their own folders.

## ANTI-PATTERNS
- Adding Supabase query logic directly in `src/apps/*/main.tsx`.
- Cross-importing admin-only behavior into user/shared apps.
- Duplicating shared business logic in multiple app shells instead of hooks/controllers.

## NOTES
- Preload pattern is used in all three app entries via `preloadPlayerCards()`.
- Admin chart modules are nested under `src/apps/admin/components/charts/` and can be data-heavy.

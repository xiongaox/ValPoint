# SRC KNOWLEDGE BASE

## OVERVIEW
`src/` contains app runtime code only: app shells, feature modules, reusable hooks, service wrappers, and low-level utilities.

## STRUCTURE
```text
src/
├── apps/         # mpa app shells (shared/user/admin)
├── features/     # feature modules (lineups is core)
├── hooks/        # reusable business hooks
├── services/     # supabase table wrappers + normalization
├── lib/          # utility modules (upload/download/system)
├── components/   # shared ui components
├── data/         # static data used by ui/hooks
├── constants/    # constants and mappings
├── types/        # shared type definitions
└── utils/        # cross-cutting helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App entry behavior | `apps/*/main.tsx`, `main.tsx` | Entrypoints should stay thin |
| Cross-app lineup flow | `features/lineups/` | Main controller + modular subcontrollers |
| Authentication/profile state | `hooks/useEmailAuth.ts`, `hooks/useUserProfile.ts` | App-level user state |
| Lineup CRUD API | `services/lineups.ts`, `services/shared.ts` | Supabase queries only |
| Download/import/image services | `lib/lineupDownload.ts`, `lib/lineupImport.ts`, `lib/imageBed/` | Utility layer, no UI state |
| Runtime env reads | `supabaseClient.ts` | `window.__ENV__` fallback chain |

## CONVENTIONS
- Keep business logic out of entry files and large page shells; move to hooks/controllers.
- Keep `services/` thin: query + normalize + explicit error throw.
- Keep `lib/` focused on utility behavior consumed by hooks/features/apps.
- TypeScript strict mode is on; avoid introducing `any` and suppression directives.

## ANTI-PATTERNS
- Putting Supabase calls directly inside `main.tsx` or app shell entry components.
- Mixing heavy business logic into presentational components in `components/`.
- Adding app-specific behavior to shared utilities without clear boundaries.
- Treating `src/main.tsx` as the only app entry (this repo is MPA).

## NOTES
- `src/main.tsx` currently mounts `apps/user/UserApp` while html entries provide actual MPA split.
- `features/lineups/useAppController.ts` is a high-complexity orchestrator; prefer editing subcontrollers first.

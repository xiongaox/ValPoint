# SERVICES KNOWLEDGE BASE

## OVERVIEW
`src/services/` provides thin data-access wrappers around Supabase tables plus small normalization helpers.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Lineup table CRUD | `lineups.ts` | Personal lineup operations |
| Shared library upsert/query | `shared.ts` | Shared table access |
| Table names/constants | `tables.ts` | Single source for table ids |
| Data normalization | `normalize.ts` | Normalize DB records for UI |
| Admin dashboard stats queries | `adminStatsService.ts` | Aggregation queries |
| User profile persistence | `userProfile.ts` | Profile update/read flows |
| Map pool cache/query | `mapPoolService.ts` | Config cache behavior |

## CONVENTIONS
- Keep services as query wrappers: input -> Supabase call -> normalized output/error.
- Handle Supabase `{ error }` explicitly and throw on failure.
- Keep table identifiers centralized in `tables.ts`; avoid string literals across files.
- Keep UI messaging outside services; callers decide user-facing text.

## ANTI-PATTERNS
- Embedding React state or component behavior inside services.
- Swallowing Supabase errors without rethrowing.
- Duplicating table names instead of using `tables.ts`.
- Adding non-I/O business orchestration that belongs in hooks/controllers.

## NOTES
- Service surface is compact but shared widely; small signature changes have broad impact.
- When adding new service functions, mirror existing naming (`*Api`, `fetch*`, `upsert*`) for consistency.

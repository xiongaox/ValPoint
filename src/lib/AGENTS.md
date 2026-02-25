# LIB KNOWLEDGE BASE

## OVERVIEW
`src/lib/` contains lower-level utility modules used by hooks/features/apps for upload, download, review, sync, and system behaviors.

## STRUCTURE
```text
src/lib/
├── imageBed/           # provider adapters and config helpers
├── lineupDownload.ts   # export/download helpers
├── lineupImport.ts     # import package parsing
├── reviewService.ts    # submission/review related helpers
├── syncService.ts      # sync and transfer flows
├── systemSettings.ts   # runtime system setting access
└── ...                 # admin/upload/email/limit helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Image bed provider behavior | `imageBed/` | OSS/COS/Kodo adapter logic |
| Download bundle behavior | `lineupDownload.ts` | Export packaging paths |
| Import package behavior | `lineupImport.ts` | ZIP/import parsing |
| Submission/review bridge | `reviewService.ts`, `submissionUpload.ts` | Upload + moderation helpers |
| Shared sync behavior | `syncService.ts` | Cross-library sync operations |
| Config and guard helpers | `systemSettings.ts`, `downloadLimit.ts`, `emailValidator.ts` | Runtime/system constraints |

## CONVENTIONS
- Keep modules framework-agnostic where possible (no React state in lib layer).
- Keep provider-specific differences encapsulated in `imageBed/`.
- Keep network/storage side effects explicit and surfaced to callers.
- Reuse shared helper utilities instead of duplicating low-level transformation logic.

## ANTI-PATTERNS
- Coupling `lib` modules to component-specific UI concerns.
- Mixing provider configuration parsing with unrelated business flows.
- Silent failure paths that hide upload/download/sync errors.
- Duplicating import/export formats in multiple files.

## NOTES
- `src/lib` is reused by both app and feature layers; backward-compatible changes are preferred.
- Validate side effects in calling hooks/controllers after editing any file here.

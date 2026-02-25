# LINEUPS FEATURE KNOWLEDGE BASE

## OVERVIEW
`src/features/lineups/` is the core product module for lineup browsing, filtering, editing, deletion, sharing, and modal composition.

## STRUCTURE
```text
src/features/lineups/
├── MainView.tsx            # main feature view layout
├── useAppController.ts     # top-level feature orchestrator
├── AppModals.tsx           # modal aggregation
├── lineupHelpers.ts        # feature-level helper builders
├── components/             # feature-local reusable ui pieces
└── controllers/            # split controllers by concern
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add feature-level state flow | `useAppController.ts`, `controllers/useAppState.ts` | Keep orchestration centralized |
| Adjust lifecycle/reset behavior | `controllers/useAppLifecycle.ts` | URL sync + state reset logic |
| Edit/create/save behavior | `controllers/useEditorController.ts` | Validation + persistence branch |
| Delete/clear behavior | `controllers/useDeletionController.ts` | Guest guard + deletion flows |
| Share/save-from-shared behavior | `controllers/useShareController.ts` | Transfer counters + callbacks |
| View mode / tab transitions | `controllers/useViewController.ts` | Tab-switch side effects |
| Modal prop wiring | `controllers/useModalProps.ts`, `AppModals.tsx` | Keep props assembly modular |

## CONVENTIONS
- Use controller split by responsibility instead of adding logic to `MainView.tsx`.
- Keep `useAppController.ts` as integration layer, not as place for new deep logic blocks.
- Reuse existing builder helpers (`useMainViewProps`, `useUiProps`, `useModalProps`) for prop composition.
- Keep guest/login checks and user-facing alert messages aligned with existing patterns.

## ANTI-PATTERNS
- Adding large business logic directly inside `MainView.tsx` or modal JSX trees.
- Bypassing controllers to call services directly from UI rendering components.
- Duplicating map/agent URL sync logic outside lifecycle/controller paths.
- Introducing new state flags in multiple controllers when one source of truth already exists.

## NOTES
- `useAppController.ts` is large and highly coupled; prefer minimal, local edits with clear side-effect awareness.
- Feature relies on hooks/services/lib boundaries: controller -> hooks -> services/lib.

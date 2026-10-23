# Tasks: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Input**: `.agents/specs/sta-350-design-system/`

## Phase 1: Decisions and category

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-350-design-system/spec.md` — covers: SC-001 — route: spec-draft
- [ ] T002 [US1] ADR 0302 and the amendment notes in `apps/docs/src/adr` — covers: SC-001 — route: adr — deps: T001
- [ ] T003 [US1] The `design-system` category in `tools/scripts/structure.mjs`, `tools/scripts/validate-repository.mjs` and `tools/scripts/scaffold.mjs`, with their tests and the regenerated `apps/docs/src/standards/structure.mdx` — covers: FR-006, P-005, SC-003 — route: package — deps: T002

## Phase 2: Tokens

- [ ] T004 [US1] `@stackra/tokens` in `packages/design-system/tokens`: contracts (the schema types) and the `stackra` theme moved from `packages/experience/brand` with its fonts — covers: FR-001, FR-002, P-001, P-002 — route: package — deps: T003
- [ ] T005 [US1] The web and native renderers and the committed CSS in `packages/design-system/tokens`, with the generator-equals-committed test — covers: FR-003, FR-004, P-001, P-003, EC-01 — route: package — deps: T004

## Phase 3: UI

- [x] T006 [US2] @stackra/ui contracts in `packages/design-system/ui/src/contracts` — covers: FR-007 — route: frontend — deps: T004
- [x] T007 [US2] @stackra/ui/react provider on HeroUI v3 (theme, direction, locale; the e2e and react-aria-components catalog entries only as the spec allows) in `pnpm-workspace.yaml` and `packages/design-system/ui/src/react` — covers: FR-008, P-006 — route: frontend — deps: T005, T006
- [x] T008 [US2] @stackra/ui/native provider on HeroUI Native and Uniwind in `packages/design-system/ui/src/native` — covers: FR-009, P-006 — route: frontend — deps: T005, T006

## Phase 4: Playground and e2e

- [x] T009 [US3] `apps/playground` with the switcher and the token foundations route in `apps/playground/src/routes` — covers: FR-010 — route: frontend — deps: T007
- [x] T010 [US3] Playwright and axe e2e over every route in light, dark, LTR and RTL in `apps/playground/e2e/__tests__` — covers: FR-011, P-007, SC-002 — route: tests — deps: T009

## Phase 5: Retire brand

- [ ] T011 [US4] Move the logos and brand assets into `apps/docs` and the app icons into `apps/mobile`, switch `apps/mobile` to `@stackra/tokens`, delete `packages/experience/brand` and clear every reference — covers: FR-005, P-004 — route: package — deps: T005
- [ ] T012 [US4] Package and category READMEs and the roadmap — covers: SC-001 — route: steward-docs — deps: T008, T010, T011

## Phase 6: Wave 1 components (ADR 0303)

Linear sub-issues, all in this one pull request: [STA-353] ADR 0303 and the shared contracts, [STA-354] Icon, [STA-357] Text and Heading, [STA-355] Button family, [STA-356] Link.

- [x] T013 [US2] Icon: contracts, `ICON_SIZES`, the web and native `Icon` and the native provider's `LucideProvider` in `packages/design-system/ui/src` — covers: FR-012, FR-013, FR-014, FR-015, P-008, P-009, P-013, P-014 — route: frontend — deps: T007, T008
- [x] T014 [US2] Text and Heading: contracts, core pieces, and the web and native components in `packages/design-system/ui/src` — covers: FR-017, FR-018, FR-019, P-010, P-011, P-012 — route: frontend — deps: T013, T015
- [x] T015 [US1] The `h4` to `h6` styles and the type scale in both renderers, `defineTheme` and the committed CSS in `packages/design-system/tokens` — covers: FR-020 — route: package — deps: T005
- [x] T016 [US3] The icon and typography routes, the page categories, the shell navigation and the index page in `apps/playground/src` — covers: FR-016, FR-021, P-015 — route: frontend — deps: T013, T014
- [x] T017 [US3] The icon and typography e2e suites in `apps/playground/e2e/__tests__` — covers: SC-004, P-015 — route: tests — deps: T016
- [x] T018 [US2] Button, IconButton and CloseButton: contracts, `omitUndefined`, and the web and native components in `packages/design-system/ui/src` — covers: FR-022, FR-023, FR-024, P-016 — route: frontend — deps: T013
- [x] T019 [US2] Link and both `RouterProvider`s: contracts, and the web and native components in `packages/design-system/ui/src` — covers: FR-025, FR-026, P-017 — route: frontend — deps: T013, T014, T018
- [x] T020 [US3] The button, icon-button, close-button and link routes, the shell and index on the `Link` and `RouterProvider` of the UI package in `apps/playground/src` — covers: FR-027, FR-028, P-018 — route: frontend — deps: T016, T018, T019

## Phase 7: Wave 2 components, part 1 (ADR 0304)

Linear sub-issues, all in this one pull request: [STA-358] Surface, Card and Separator (with ADR 0304), [STA-359] Chip and StatusBadge, [STA-360] Badge.

- [x] T021 [US2] Surface, Card and Separator: contracts, and the web and native components in `packages/design-system/ui/src`, with ADR 0304 — covers: FR-029, FR-030, FR-031, P-019, P-020, P-021, P-022 — route: frontend — deps: T018
- [x] T022 [US3] The surface, card and separator routes, the Surfaces category and the close-button sample on `Card` in `apps/playground/src`, with their e2e files — covers: FR-032, P-030, SC-005 — route: frontend — deps: T021
- [x] T023 [US2] Chip and StatusBadge: contracts, `STATUS_DOT_ROLE`, and the web and native components in `packages/design-system/ui/src` — covers: FR-033, FR-034, FR-035, P-019, P-023, P-024, P-025 — route: frontend — deps: T013, T018
- [x] T024 [US3] The chip and status-badge routes and the Status category in `apps/playground/src`, with their e2e files — covers: FR-036, P-030, SC-005 — route: frontend — deps: T023
- [x] T025 [US2] Badge with `Badge.Anchor`: contracts, `physicalPlacementOf`, and the web and native components in `packages/design-system/ui/src` — covers: FR-037, FR-038, FR-039, P-019, P-026, P-027, P-028, P-029 — route: frontend — deps: T013, T018, T023
- [x] T026 [US3] The badge route in `apps/playground/src`, with its e2e file — covers: FR-040, P-030, SC-005 — route: frontend — deps: T025

## Phase 8: Wave 2 components, part 2 (ADR 0304)

Linear sub-issues, all in this one pull request: [STA-361] Avatar, [STA-363] Spinner, [STA-362] Skeleton.

- [x] T027 [US2] Avatar: contracts, `initialsOf`, `AVATAR_SQUARE_CLASS_NAME`, and the web and native components in `packages/design-system/ui/src` — covers: FR-041, FR-042, FR-043, FR-044, P-031, P-034 — route: frontend — deps: T013, T018
- [x] T028 [US2] Spinner: contract and the web and native components in `packages/design-system/ui/src` — covers: FR-041, FR-042, FR-043, P-032, P-034 — route: frontend — deps: T013
- [x] T029 [US2] Skeleton and SkeletonGroup: contracts, the web and native components, and the reduced-motion and right-to-left skeleton rules of `packages/design-system/tokens` — covers: FR-041, FR-042, FR-043, FR-045, P-033, P-034 — route: frontend — deps: T013
- [x] T030 [US3] The avatar, spinner and skeleton routes in `apps/playground/src`, with their e2e files — covers: FR-046, P-035, SC-006 — route: frontend — deps: T027, T028, T029

## Phase 9: Icons (ADR 0303 decision 10)

Linear issues: [STA-405] `@stackra/icons` and name-based icons, [STA-354] Icon.

- [x] T031 [US2] The icons package: the `IconName` contract and the generated Lucide name list, `defineIconRegistry`, `findIcon`, `isIconName`, the per-platform registry providers and the opt-in Lucide entries in `packages/design-system/icons` — covers: FR-047, FR-048, FR-049, FR-050, FR-051, P-036, P-037, P-038, P-039, P-040 — route: package — deps: T013
- [x] T032 [US2] `Icon` by name and the name-or-element icon slots of Button, IconButton, CloseButton and Chip in `packages/design-system/ui/src` — covers: FR-052, FR-053, P-041, P-042 — route: frontend — deps: T031
- [x] T033 [US3] The playground registers only the icons it draws and imports no Lucide package in `apps/playground/src` — covers: FR-054, P-043 — route: frontend — deps: T032

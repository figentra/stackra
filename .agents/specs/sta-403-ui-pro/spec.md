# Feature Specification: `@stackra/ui-pro`, private HeroUI Pro wrappers for Stackra's own apps

**Feature Branch**: `figentra/sta-403-ui-pro`

**Created**: 2026-10-23

**Status**: Implementing

**Linear**: STA-403

**Linear project**: Stackra Design System

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner decisions of 2026-10-23 for `@stackra/ui-pro`, recorded in ADR 0304 in the same pull request. Source
decisions: ADR 0165 decision 5 (free packages never depend on Pro), ADR 0197 (HeroUI Pro only in our own apps), ADR 0302
(the Stackra Design System), ADR 0303 decision 7 (the props vocabulary, on the open waves 1 to 3 branch).

## Impact

- **Apps touched**: `apps/playground` (a "Pro" navigation group with one route per web component), `apps/docs` (ADR
  0304, the ADR 0197 amendment note, the setup runbook)
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui-pro` (new, `@stackra/ui-pro`, private)
- **Public contract change**: none published; `@stackra/ui-pro` is private and never published. Its `./contracts`,
  `./react` and `./native` entries are for our own apps only
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the Quality Gate job gains `id-token: write` for one Infisical step (change risk R3)
- **Secrets**: `HEROUI_AUTH_TOKEN` (HeroUI's CI/CD token) is read from Infisical `/ci` in CI; the owner sets the value
  and the `INFISICAL_GATE_IDENTITY_ID` repository variable. No value is read, printed or stored by this change
- **ADR needed**: yes, ADR 0304 (written by `docs-adr-steward` in this pull request), amending ADR 0197 decision 4
- **New dependencies**: owner-approved 2026-10-23: `@heroui-pro/react` 1.0.0-beta.10 and `recharts` 3.10.1 in
  `catalog:frontend`; `heroui-native-pro` 1.0.0-beta.11, `@internationalized/date` 3.12.4 and
  `@internationalized/number` 3.6.9 in `catalog:mobile`; `allowBuilds` for the two Pro postinstalls
- **Deploy modes**: none; a private library and a dev-only app
- **Licence tier**: our wrapper code is MIT like the repository; HeroUI Pro stays under its own licence, is never
  committed or bundled, and reaches only our own apps (ADR 0113 context, ADR 0197)
- **UI surfaces**: `apps/playground` (not shipped to users)
- **Docs to update**: ADR 0304, the ADR 0197 note, the setup runbook's `/ci` row, the package README and AGENTS
- **Lane**: lite (recorded reason: every decision was taken by the owner on 2026-10-23 and is recorded in ADR 0304 in
  the same pull request)
- **Change risk**: R3 (a CI permission: the Quality Gate gains `id-token: write`)

## Decisions taken by the owner (2026-10-23)

1. `@stackra/ui-pro` is private (`"private": true`, no `publishConfig`), never published, and imported only by our own
   apps: console, docs, playground and Figentra OS. `@stackra/ui` and every free or published package never import it.
2. It lives at `packages/design-system/ui-pro` and wraps HeroUI Pro (web) and HeroUI Native Pro (native) with the
   `@stackra/ui` props vocabulary; contracts in its own `src/contracts`, reusing `@stackra/ui/contracts` types.
3. Pro `Command` is wrapped as `ActionPalette`; first components are DataGrid, ActionPalette, Sidebar and AppLayout,
   Kanban, KPI and TrendChip on web, and ProgressButton, SlideButton, SwipeableRow, Calendar and DatePicker, and
   NumberField on native.
4. CI installs HeroUI Pro with a token from Infisical `/ci` over OIDC (lead's recommendation, applied: the name is
   `HEROUI_AUTH_TOKEN`, the only variable HeroUI's postinstall reads).

## User Scenarios & Testing

### User Story 1 - Pro components in our own apps (Priority: P1)

A Stackra app builder imports a Pro component from `@stackra/ui-pro/react` or `@stackra/ui-pro/native` with the same
props vocabulary as `@stackra/ui` (`size`, `tone`, `isDisabled`, `isLoading`, `label`, `onPress`).

**Independent Test**: unit tests per component prove each contract prop reaches HeroUI Pro under its HeroUI name and
unknown props pass through.

### User Story 2 - Pro never leaks into a free package (Priority: P1)

**Independent Test**: the validator refuses a non-app member other than `@stackra/ui-pro` that depends on HeroUI Pro or
on `@stackra/ui-pro`, and refuses `@stackra/ui-pro` without `"private": true` or with a `publishConfig`.

### User Story 3 - Review in the playground (Priority: P2)

**Independent Test**: every web Pro component has a playground route under a "Pro" group, covered by the Playwright and
axe e2e in light, dark, LTR and RTL.

### Edge Cases

- **EC-01**: The CI install runs without the HeroUI Pro token: the gate stops at a named step saying what is missing,
  instead of failing later on missing types.
- **EC-02**: A HeroUI Pro component or part cannot be verified against its docs and types: it is skipped and listed in
  the pull request.

## Requirements

- **FR-001**: `@stackra/ui-pro` SHALL be private and unpublished, and `pnpm validate` SHALL refuse any non-app member
  other than it that depends on `@heroui-pro/react`, `heroui-native-pro` or `@stackra/ui-pro`.
- **FR-002**: Its contracts SHALL live in its own `src/contracts` and reuse `@stackra/ui`'s value types through
  `@stackra/ui/contracts` only.
- **FR-003**: `@stackra/ui-pro/react` SHALL provide `DataGrid` over HeroUI Pro's DataGrid.
- **FR-004**: `@stackra/ui-pro/react` SHALL provide `ActionPalette` over HeroUI Pro's Command.
- **FR-005**: `@stackra/ui-pro/react` SHALL provide `Sidebar` and `AppLayout` over HeroUI Pro's.
- **FR-006**: `@stackra/ui-pro/react` SHALL provide `Kanban` over HeroUI Pro's.
- **FR-007**: `@stackra/ui-pro/react` SHALL provide `Kpi` and `TrendChip` over HeroUI Pro's KPI and TrendChip.
- **FR-008**: `@stackra/ui-pro/native` SHALL provide `ProgressButton` over HeroUI Native Pro's.
- **FR-009**: `@stackra/ui-pro/native` SHALL provide `SlideButton` over HeroUI Native Pro's.
- **FR-010**: `@stackra/ui-pro/native` SHALL provide `SwipeableRow` over HeroUI Native Pro's.
- **FR-011**: `@stackra/ui-pro/native` SHALL provide `Calendar` and `DatePicker` over HeroUI Native Pro's.
- **FR-012**: `@stackra/ui-pro/native` SHALL provide `NumberField` over HeroUI Native Pro's.
- **FR-013**: `apps/playground` SHALL show each web Pro component on its own route under a "Pro" navigation group,
  with a Playwright and axe e2e file per component.
- **FR-014**: The Quality Gate SHALL install HeroUI Pro with `HEROUI_AUTH_TOKEN` read from Infisical `/ci` over GitHub
  OIDC, and the release build SHALL build only the published packages.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)
- **SC-002**: The playground e2e reports no axe violation on any Pro route in the four combinations — verified by: e2e

## Out of scope

- Other HeroUI Pro components (charts beyond KPI, AI, forms); each is added when an app needs it.
- Native components in the playground (it is a web app); they are covered by unit tests.
- Caching `node_modules` in CI to save HeroUI CDN downloads (a follow-up).
- Converting the console or Figentra OS to use the package.

## Assumptions

- HeroUI Pro installs from the public npm registry as a shell whose postinstall downloads the licensed build from
  HeroUI's CDN; a `heroui-pro login` session serves local installs (verified against the HeroUI Pro docs and the
  published packages, 2026-10-23).

## Status history

- 2026-10-23 · — → Draft · Claude (lead) · from the owner decisions of 2026-10-23 (lite lane, lead's reason)
- 2026-10-23 · Draft → Clarified · Claude (lead) · no open questions: the owner decided, the token name is the lead's
  recommendation recorded in ADR 0304
- 2026-10-23 · Clarified → Planned · Claude (lead)
- 2026-10-23 · Planned → Tasked · Claude (lead)
- 2026-10-23 · Tasked → Implementing · Claude (lead) · builders under way

# Feature Specification: `pnpm new` scaffolds members in the programming model v3 shape

**Feature Branch**: `figentra/sta-347-v3-scaffold`

**Created**: 2026-10-23

**Status**: Implementing

**Linear**: STA-347

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Lead request (STA-347): "`pnpm new <kind> <name>` produces members in the programming model v3 shape, and
`tools/scripts/structure.mjs` carries the v3 group table, so every package built from now on comes out of the tool
identically." Source of truth: ADR 0294 (grammar R1 to R12, group folders, kind table, identities, decisions 25 to 28),
ADR 0295 (`stackra.config.ts`, generated entries, member-root rule and its exemptions), ADR 0296 (member runway v3),
ADR 0300 (presets) and the v3 rules and skills in `.agents`.

## Impact

- **Apps touched**: `apps/docs` (the generated `standards/structure.mdx` and the `guides/scaffolding.mdx` page); no app
  source changes
- **Services touched**: none (the v2 members `services/example` and `services/health` are converted under STA-344)
- **Packages touched**: none (the templates and scripts live in `tools/`)
- **Public contract change**: the `pnpm new` output; `--entries` takes only `react,native` (`devtools` is gone, as ADR
  0294 decision 23 lists six entries), the new `--data` flag adds a package's database folders, and `--description` is
  required (no placeholder, so no TODO in generated output)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the service template's `runway.yaml` holds secret names only, as ADR 0296 requires
- **Secrets**: none
- **ADR needed**: no; implements ADR 0294, 0295 and 0296 as accepted. The one question the ADRs leave open (which entry
  exports a package's config classes, ADR 0177 amendment) was decided by the lead in review round 1, below
- **New dependencies**: none
- **Deploy modes**: none; repository tooling only, the same for SaaS, on-prem and air-gapped
- **Licence tier**: not distributed (repository tooling); scaffolded packages keep MIT and apps and services UNLICENSED
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/guides/scaffolding.mdx`, `apps/docs/src/docs/standards/structure.mdx` (generated),
  `tools/scaffold/README.md` and the template READMEs, and the one sentence each in `.agents/rules/workspace-layout.md`,
  `.agents/rules/service-checklist.md` and the `backend-module-and-root-module` skill that said `checkService` requires
  `src/main.ts`
- **Lane**: lite (recorded reason: one tool and its templates, additive for every existing member, no ADR; the line
  count is over the lite guide because the templates are files, not logic)
- **Change risk**: R1 (repository tooling; every existing member and check keeps passing)

## Decisions taken from the ADRs

- **No authored entry barrels** (ADR 0294 decision 15, rule R12). Until gen writes them (STA-339), a package's
  `exports` key names its entry's one public file directly, as `@stackra/brand`'s `./tokens` already does: `.` is
  the config class `src/config/<name>.config.ts` and `./node` is the root module. An entry folder with no file yet
  (`core/`, `contracts/`, `testing/`, `react/`, `native/`) holds a README and has no export of its own (ADR 0126:
  entries only with real code).
- **Static files** (ADR 0177 and ADR 0234, amendments of 2026-10-21): a package gets `assets/public/` and
  `assets/lang/` at its root, listed in `files` and exported as `./assets/*`. The template marks this in the package README (an "Exports today" column), in `AGENTS.md` and in the
  tsdown config header; an entry that gets a second public file before gen ships adds a stand-in `src/<entry>/index.ts`
  whose header `Purpose:` starts with `Stand-in barrel:`, so STA-339 can find and replace every one.
- **No `stackra.manifest.json` placeholder.** Gen writes the manifest on its first run; a hand-written placeholder would
  be authored generated output (rule R10) in a format no ADR fixes. A package lists it in `files` so it ships once gen
  writes it (decision 26).
- **Kind bases are stand-ins.** `@stackra/container`, `@stackra/config` and `@stackra/app` do not ship, so the root
  module, the Config class and the route classes are plain classes, and `stackra.config.ts` exports plain static data;
  each carries a `shortcut:` line with the base it will extend and the issue that ships it (STA-76, STA-77, STA-339).
- **Apps keep their runtime entry and tool files as marked stand-ins.** Vite needs `index.html` and `src/main.tsx`,
  Expo needs `package.json` `main`, `app.json` and Metro, and Electron needs its main process today; gen writes them
  later (ADR 0295 decisions 5 and 7). A service needs no entry before gen, so its template drops `main.ts`, the
  `stackra.module` field and the `dev`/`start` scripts.
- **Package presets.** A package uses the `decorators` TypeScript, tsdown and vitest presets, because v3 kinds take
  field decorators and constructor parameter properties (ADR 0005, rule R6).
- **Root module tests are unit tests** until `createTestingModule` ships; then they become `.int.test.ts`.

## Decided in review round 1

- **Which entry exports a package's config classes?** ADR 0294 decision 15 places them in `src/config/`, and the ADR
  0177 amendment says the entry is not settled. Decision (the lead, 2026-10-23, following the builder's
  recommendation): `.` (core) exports them, so a host can subclass a package's config class, as the config override
  form of ADR 0294 decision 19 needs. `PACKAGE_FOLDERS` in `structure.mjs` records `config/` under `.`, and the
  template's `.` export names the config class (its one public file until gen writes the barrel). The template's
  placeholder core constant is dropped, so `.` keeps one public file and no stand-in barrel is scaffolded.

## User Scenarios & Testing

### User Story 1 - A package builder runs `pnpm new package` and gets the v3 shape (Priority: P1)

**Independent Test**: the scaffold test renders a package into a temporary directory and asserts the tree, the exports
and the presets; a real `pnpm new package data/<tmp>` in the worktree passes `pnpm validate`, typecheck, lint, test and
build.

**Acceptance Scenarios**:

1. **Given** `pnpm new package billing-core --category data`, **When** it runs, **Then** the member has
   `stackra.config.ts`, `src/config/billing-core.config.ts`, `src/contracts/`, `src/core/`, `src/node/billing-core.module.ts`
   and `src/testing/`, no `main.ts`, no barrel and no manifest, and every export names an existing file.
2. **Given** `--entries react,native --data`, **When** it runs, **Then** `src/react/`, `src/native/` and
   `src/node/database/{migrations,factories,seeders}/` exist and the `#react/*` and `#native/*` aliases are declared.

### User Story 2 - A service builder runs `pnpm new service` (Priority: P1)

**Independent Test**: the scaffold test asserts the service tree, the runway v3 keys and the group list in
`src/modules/README.md`; `checkService` passes on it.

### User Story 3 - App templates follow the same member shape (Priority: P2)

**Independent Test**: the scaffold test asserts each app's `stackra.config.ts`, root module, route folders and config
classes, and that only the marked stand-ins sit beside the root module in `src/`.

### User Story 4 - The validator accepts both shapes during the transition (Priority: P1)

**Independent Test**: validator tests for a v2 service and a v3 service.

### Edge Cases

- **EC-01**: `--entries contracts,node` (always-present entries) is accepted and ignored; `--entries devtools` fails.
- **EC-02**: `--data` with a kind other than `package` fails.
- **EC-03**: A service with neither `src/main.ts` nor the v3 files gets the v3 findings, which name the v2 way out.
- **EC-04**: `pnpm new` without `--description` (or with a blank one) fails with a message that says what the sentence
  is for; no kind writes a placeholder.

## Requirements

- **FR-001**: `pnpm new package` SHALL write `stackra.config.ts`, `assets/public/` and `assets/lang/`, a Config class in
  `src/config/` exported from `.`, `src/contracts/`, `src/core/`, the root module `src/node/<name>.module.ts` and
  `src/testing/`, each test in `__tests__/`, a `package.json` whose `exports` name existing files (and `./assets/*`)
  with `files` and `sideEffects: false`, `LICENSE`, `README.md`,
  `AGENTS.md`, `CHANGELOG.md`, the decorators presets and the `tier:lib` tag, and SHALL write no `main.ts`, entry barrel
  or `stackra.manifest.json`.
- **FR-002**: `pnpm new service` SHALL write `stackra.config.ts`, the root module `src/<name>.module.ts`, a Config class,
  `src/contracts/`, `src/modules/` with a README listing every module group of ADR 0294 decision 13, and a runway v3
  `runway.yaml` (`version: 3`, `requires`, `secrets`, `environments`, no member key), and SHALL write no `main.ts`,
  `stackra.module` field, `dev`/`start` script, Encore file or manifest.
- **FR-003**: `pnpm new package` SHALL add `src/react/` and `src/native/` only with `--entries`, the module's
  `src/node/database/{migrations,factories,seeders}/` only with `--data`, an `exports` key only for an entry with a file,
  and one `#` alias per `src/` folder it writes.
- **FR-004**: `pnpm new app:console|app:mobile|app:desktop` SHALL write `stackra.config.ts` and the root module
  `src/<name>.module.ts`, routes as `routes/<name>/` folders (console, mobile), the chrome config at
  `src/config/chrome.config.ts` (mobile) and styles in `src/styles/`, keeping the runtime entry and tool files as
  stand-ins marked `shortcut:`; `app:docs` and `tooling` SHALL stay exempt.
- **FR-005**: `validate-repository.mjs` SHALL accept a v2 service (`src/main.ts` and an existing `stackra.module`) and a
  v3 service (`stackra.config.ts` and `src/<dir>.module.ts`, no `src/main.ts`) through the named transition branch
  `isV2Service`, checking existence only, until STA-344.
- **FR-006**: `structure.mjs` SHALL carry the v3 module groups, app groups, package folders, member root and entries as
  data with `rootModuleOf` and `groupsFor` lookups, and SHALL render them into `standards/structure.mdx`.

## Success Criteria

- **SC-001**: A real `pnpm new package data/<tmp>` in the worktree passes `pnpm validate` and the member's lint, typecheck, test, coverage and build — verified by: manual (run before the commit, temp member deleted)
- **SC-002**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)

## Out of scope

- The v3 shape checks beyond existence: `kind-path` (STA-338), `member-root`, `tool-configs`, `entries`, `runway`
  (STA-339) and the decorator and gen checks (STA-340).
- Converting `services/example`, `services/health`, `apps/console`, `apps/mobile` and `workers/static` (STA-344).
- Gen, the kind bases and the generated entries, tool files and barrels (STA-339 and the package issues).
- Replacing the pre-v3 `KIND_FOLDERS` table that `kindOfFile` and doc-standard still read (STA-340).

## Assumptions

- Metro (0.84) takes only the first target of a package.json `imports` array and adds no extension, so the mobile
  template maps `#src/*` in its stand-in `metro.config.js`; `expo export` bundles the scaffolded app.

## Status history

- 2026-10-23 · — → Draft · Claude (builder) · from STA-347 and ADR 0294 to 0296 (lite lane)
- 2026-10-23 · Draft → Clarified · Claude (builder) · decisions taken from the ADRs; one open question recorded
- 2026-10-23 · Clarified → Planned · Claude (builder)
- 2026-10-23 · Planned → Tasked · Claude (builder)
- 2026-10-23 · Tasked → Implementing · Claude (builder)
- 2026-10-23 · Implementing (review round 1) · Claude (builder) · reviewer should-fixes 1-5 fixed; config entry decided
  by the lead

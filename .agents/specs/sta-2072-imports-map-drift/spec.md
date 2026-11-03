# Feature Specification: imports-map drift check

**Feature Branch**: `figentra/sta-2072-imports-map-drift`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2072

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Work package wp-23 of the gen coverage path, closing gap G-142: a member's `package.json` `imports` map is
scaffolded, not generated, and nothing checks it.

- ADR 0233 decision 1 and ADR 0006 rule 5: the map is generated, not hand-written. ADR 0233 lists a check of the map
  as planned.
- `packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts` (`aliasOf`, `packageImports`): `stackra
new` writes the map once, for a package only, from the entry list rather than the folders it rendered. Apps take the
  map their template carries.
- On main, 120 of the 123 members that are not tooling presets drift from one rule: targets list 2, 3 or 4 fallbacks
  for the same kind of folder, 4 of the 7 packages with a `plugin/` folder have no `#plugin/*`, `src/agent` in
  `packages/infrastructure/infra-testbed` has no alias, and only `apps/playground` maps `#src/*.function`. In every
  member the first target of every alias already matches the rule below, and no member maps a key the rule would drop.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: `apps/console`, `apps/docs`, `apps/mobile`, `apps/playground`: their `package.json` `imports` map
  is regenerated (fallback targets and aliases added, nothing removed, no first target changed).
- **Services touched**: `services/example`, `services/health`: their `imports` map is regenerated (as above).
- **Packages touched**: `packages/developer/cli` (the builder, the check, the scaffold); every `packages/*/*` member
  except the five `packages/tooling/*` presets, and every `workers/*` member, has its `imports` map regenerated (as
  above). `tools/scaffold/templates/apps/{console,desktop,mobile}/package.json` lose the `imports` map the scaffold now
  writes.
- **Public contract change**: additive. `stackra validate --repository` gains one finding; the regenerated maps only
  add aliases and fallback targets, so every specifier that resolves today resolves to the same file. No package export,
  manifest, action or event changes.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no. ADR 0233 decision 1 already decides the map is generated; this ships its planned check. The
  ADR's Enforcement section moves the check from planned to automated.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0233-imports-use-subpath-aliases-only.mdx` (Enforcement: the drift check
  is automated); `packages/developer/cli/README.md` if it lists the `validate --repository` checks.
- **Lane**: full
- **Change risk**: R2 (several members' `package.json` change, and the repository gate gains a check)

## Glossary _(full lane)_

- **Imports map**: the `imports` field of a member's `package.json`, which declares its `#` aliases (ADR 0233).
- **Generated map**: what `importsMap(dir)` returns for a member folder, from the folders it has.
- **Drift**: a member whose `imports` map differs from its generated map, by a key or by a target.
- **First target**: the first entry of an alias's target list, the only one Node and esbuild try; bundlers and tsc try
  the fallbacks after it.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The repository gate refuses a drifted imports map (Priority: P1)

A contributor adds `src/react/` to a package and forgets the alias, or edits a target by hand. `pnpm validate` (which
runs `stackra validate --repository`) reports the member, the aliases to add or remove and the aliases whose targets
differ, and exits 1. A member whose map equals the generated one passes.

**Why this priority**: it is the gap: the map is meant to be generated, and nothing keeps it so.

**Independent Test**: build a member folder in a temporary root with a `package.json` whose map lacks an alias for one
of its `src/` folders; `importsMapFindings(root)` returns one finding naming that alias. With the generated map, it
returns none.

**Acceptance Scenarios**:

1. **Given** a package with `src/core/` and `src/node/` whose map has no `#node/*`, **When** the check runs, **Then**
   it reports the member with `add #node/*`.
2. **Given** a member whose map has `#core/*` targeting only `./src/core/*` and `./src/core/*.ts`, **When** the check
   runs, **Then** it reports `retarget #core/*`.
3. **Given** a member whose map equals the generated one with its keys in another order, **When** the check runs,
   **Then** it reports nothing.
4. **Given** main after this change, **When** `stackra validate --repository` runs, **Then** it reports no imports-map
   finding.

---

### User Story 2 - `stackra new` writes the generated map (Priority: P2)

`stackra new` writes the same map the check expects, from the folders the scaffold rendered, for a package and for an
app, so a new member passes the gate without an edit.

**Why this priority**: without it, the check and the scaffold would disagree on day one.

**Independent Test**: scaffold a package and a console app into a temporary root; each `package.json` `imports` equals
`importsMap(dest)`.

**Acceptance Scenarios**:

1. **Given** `stackra new package` with the react entry, **When** it renders, **Then** the map has one alias per
   rendered `src/` folder, including `#react/*`, and `#stackra/*`.
2. **Given** `stackra new app:console`, **When** it renders, **Then** the map is the `#src/*` layout.

---

### Edge Cases

- **EC-01**: A member with files directly in `src/` (an app's `main.ts`, a service's root module, the showcase's
  `index.ts`) gets the `#src/*` layout, not one alias per folder, because a per-folder alias cannot reach those files.
- **EC-02**: `src/__tests__/` gets no alias; tests import their subject through its own alias.
- **EC-03**: A root `scripts/` folder holds plain Node scripts (`node scripts/...`); Node tries only the first target,
  so `#scripts/*` maps to the single target `./scripts/*.ts`.
- **EC-04**: With the `#src/*` layout, `#src/*.function` maps to `./src/*.function.ts`, because config-time code run by
  Node or esbuild (Vite plugins under `scripts/`) imports `*.function` files and tries only the first target.
- **EC-05**: The five `packages/tooling/*` presets (`stackra.tier` `config`) carry no map and are not checked (ADR 0233
  decision 6 exempts them).
- **EC-06**: Key order does not count as drift; target order does, since resolvers try targets in order.
- **EC-07**: A member with no `imports` field at all is reported with every generated alias to add.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE builder `importsMap(dir)` SHALL return, for a member folder, `#src/*` and `#src/*.function` WHEN
  `src/` holds a file directly, and otherwise one `#<folder>/*` per folder of `src/` other than `__tests__`.
- **FR-002**: THE builder SHALL add `#plugin/*` WHEN the member has a root `plugin/` folder, `#scripts/*` (single
  target `./scripts/*.ts`) WHEN it has a root `scripts/` folder, and `#stackra/*` (to `.stackra/gen`) always.
- **FR-003**: THE builder SHALL give every array alias the targets `./<path>/*`, `./<path>/*.ts`, `./<path>/*.tsx` and
  `./<path>/*/index.ts`, in that order.
- **FR-004**: WHEN `stackra validate --repository` runs THE check SHALL report each workspace member, other than a
  `stackra.tier` `config` member, whose `imports` map differs from `importsMap(dir)`, naming the aliases to add, to
  remove and to retarget, and the command SHALL exit 1.
- **FR-005**: THE check SHALL compare maps without regard to key order.
- **FR-006**: WHEN `stackra new` renders a template kind other than a tooling preset through `scaffold` (an app, or a
  package given `--entries` or `--data`) THE scaffold SHALL write `importsMap(dest)` as its `imports` map.
- **FR-007**: THE repository SHALL hold, for every checked member, the generated map, so the check passes on main.

### Key Entities _(include if feature involves data)_

None.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a member's `src/` holds only folders THE builder SHALL return one alias per folder except
  `__tests__`, plus `#stackra/*`.
- **AC-002**: WHEN a member's `src/` holds a file directly THE builder SHALL return `#src/*.function`, `#src/*` and
  `#stackra/*`.
- **AC-003**: WHEN a member has root `plugin/` or `scripts/` folders THE builder SHALL add `#plugin/*` (four targets)
  and `#scripts/*` (`./scripts/*.ts`).
- **AC-004**: IF a member's map lacks a generated alias, has an extra alias or has different targets THEN THE check
  SHALL report that member with `add`, `remove` or `retarget` and the alias.
- **AC-005**: WHEN a member's map equals the generated one in any key order THE check SHALL report nothing.
- **AC-006**: IF a member's `stackra.tier` is `config` THEN THE check SHALL skip it.
- **AC-007**: WHEN `stackra new` renders a package or an app THE written map SHALL equal `importsMap(dest)`.
- **AC-008**: WHEN `stackra validate --repository` runs on this branch THE output SHALL hold no imports-map finding.

## Success Criteria _(mandatory)_

- **SC-001**: The builder and the check behave as AC-001 to AC-006 — verified by: unit
  (`imports-map.function.test.ts`).
- **SC-002**: A scaffolded package and app pass the check — verified by: unit (`scaffold.test.ts`).
- **SC-003**: All members pass on main — verified by: ci-box run of `stackra validate --repository` with no imports-map
  finding.
- **SC-004**: No member's resolution changes — verified by: ci-box typecheck, test and build of the affected members
  (turbo over the changed `package.json` files), and the diff showing no removed key and no changed first target.
- **SC-005**: The CLI package's gate (format, lint, typecheck, test, build) is green — verified by: ci-box run.

## Out of scope

- A command that rewrites drifted maps (`--fix`): the finding names each alias to change, and the scaffold writes the
  map for new members. The one-time regeneration of main uses the builder from an untracked script.
- Checking that every `#` specifier a file imports is declared in its member's map (the other planned check in ADR
  0233): a separate gap.
- `#modules/*` and `#assets/*` (ADR 0294's amendment of ADR 0233): no member in this repository has a `src/modules/`
  folder or maps `#assets/*` yet. A v3 service has its root module directly in `src/`, so the rule gives it the
  `#src/*` layout and not `#modules/*`; teaching the rule both aliases is a follow-up (STA-344 converts members).
- `stackra new package` without `--entries` or `--data`, and `stackra new service`: they write the product-template
  shape (`packageTemplate`, `serviceTemplate`, pure text for any repository, with `#src/*`, `#assets/*` and, for a
  service, `#config/*`, `#contracts/*` and `#modules/*`), which the folder rule does not derive yet. A member made that
  way in this repository is reported by the check and takes the generated map by hand until STA-2082.
- Converting the `#src/*` layout members to per-folder aliases: a code change in every importing file, not a map change.

## Assumptions

- The first target is the only one Node and esbuild try, and the extra fallbacks only matter to bundlers and tsc, so
  adding fallbacks after an unchanged first target changes no resolution that works today (checked: no first target
  changes, no key is removed).
- `stackra.tier` in `package.json` is present and correct for every member, since `stackra validate --repository`
  already checks it against `STACKRA_MANIFEST_SCHEMA` and the folder.
- Workspace members are the folders `readManifestMembers(root)` returns (the globs in `pnpm-workspace.yaml`), as the
  other `validate --repository` checks use.

## Amendments

- 2026-11-03 (implementation): FR-006 is limited to the kinds rendered through `scaffold`; `stackra new package`
  (without `--entries` or `--data`) and `stackra new service` write the product-template map, which keeps `#assets/*`
  and `#modules/*` the folder rule cannot derive yet, so they move to Out of scope (follow-up STA-2082). The old Out of scope line claimed
  the per-folder rule gives a service `#modules/*`; a service's root module sits directly in `src/`, so it gets the
  `#src/*` layout.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2072 session) · created

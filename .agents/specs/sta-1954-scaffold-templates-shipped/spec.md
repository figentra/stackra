# Feature Specification: `stackra new` works inside an app made by `stackra create`

**Feature Branch**: `figentra/sta-1954-scaffold-templates-shipped`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: small

**Linear**: STA-1954

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Stackra production-readiness drive, item 5.5 ("make `stackra new` work inside a created app: ship the
scaffold templates, the packages folder, dry-run"). In an app made by `stackra create`, the template kinds of
`stackra new` (`app:*`, `tooling`, and `package` with `--entries` or `--data`) read `tools/scaffold/templates` from the
workspace root. That folder exists only in core, so every one of them failed. A created app also starts with no
`packages/` folder, so `stackra new package` refused every category, and `--dry-run` still wrote files for `package`,
`service` and `seed-pack` (STA-2616).

### Sources

- `packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts` (before: `join(home,
"tools/scaffold/templates")`) — FR-001, FR-003, FR-004
- `packages/developer/cli/src/node/constants/new-command.constant.ts` (before: a missing `packages/<category>` refused;
  `--dry-run` honoured only by the template kinds) — FR-005, FR-006
- `packages/developer/cli/tsdown.config.ts`, `packages/developer/cli/turbo.jsonc` — FR-002
- `tools/scaffold/templates/packages/package/` (the package template's config, root module, tsdown and vitest files) —
  FR-007
- `pnpm-workspace.yaml` of the Stackra template (`catalog:` for React, `catalog:stackra` for the framework,
  `catalogMode: strict`) — FR-004
- ADR 0126 (member shapes and scaffold templates), ADR 0282 decision 3 (`new` is published in the CLI), ADR 0013
  (versions come only from catalogs), ADR 0515 (`stackra create` and the published starter; written on the open
  STA-2794 branch), ADR 0294 rule R12 and ADR 0295 (programming model v3 shapes)
- STA-1954, STA-2616 (Linear); the branch's commit `2f159d40f` and its tests (FR-001 to FR-007)

## Impact

- **Apps touched**: none (`apps/docs`: the scaffolding guide only)
- **Services touched**: none
- **Packages touched**: packages/developer/cli (`scaffold`, `scaffoldTemplates`, `retargetCatalogs`,
  `cliPackageRoot`, `cliVersion`, the `new` command, the build config and turbo inputs); `tools/scaffold/templates`
  (the package template, shipped by the CLI)
- **Public contract change**: none. `@stackra/cli` exports no code (`exports` is `./package.json` only); the
  `stackra new` flags are unchanged. Behaviour: the template kinds render from the shipped copy where the workspace has
  no templates, `--dry-run` writes nothing for every kind, and a standard category's missing folder is created.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the CLI reads the workspace's `pnpm-workspace.yaml` and writes only the one new
  member folder (plus a standard category folder), as before
- **Secrets**: none
- **ADR needed**: no (implements ADR 0126 and ADR 0515 as written)
- **New dependencies**: none (`yaml` and `@stackra/repo-checks` are already dependencies of the CLI)
- **Deploy modes**: build-time tooling only; same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/guides/scaffolding.mdx` (the scaffolding guide), `packages/developer/cli/README.md`
  (the CLI README), `tools/scaffold/templates/packages/README.md`, `.changeset/cli-new-in-a-created-app.md` (minor
  for `@stackra/cli`)
- **Lane**: lite
- **Change risk**: R1 (a developer command; core keeps rendering from its own `tools/scaffold/templates`)

## Requirements

### Functional Requirements

- **FR-001**: THE `scaffold` function SHALL render from the workspace's own `tools/scaffold/templates` when that folder
  exists, else from `dist/scaffold-templates` inside the installed `@stackra/cli`, and SHALL refuse with an error
  naming both places when neither exists.
- **FR-002**: THE `@stackra/cli` build SHALL copy core's `tools/scaffold/templates` to `dist/scaffold-templates`
  (inside the published `files`), and a template change SHALL invalidate the CLI's turbo build and test caches.
- **FR-003**: WHEN `scaffold` renders a package THE `scaffold` function SHALL name it as `memberNaming` names a
  `stackra new package` member (the product's name in a product).
- **FR-004**: WHEN `scaffold` renders into a workspace with a `pnpm-workspace.yaml` THE `scaffold` function SHALL point
  each `catalog:` or `workspace:` dependency at the catalog that holds the package, and `stackra new` SHALL name every
  `catalog:` dependency no catalog holds.
- **FR-005**: WHEN `stackra new package` names a category from `CATEGORY_NAMES` whose folder is missing THE `new`
  command SHALL create the folder with the member; another missing category SHALL be refused, naming the standard
  ones.
- **FR-006**: WHEN `--dry-run` is given THE `new` command SHALL write nothing for every kind (`package`, `service`,
  `seed-pack` and the template kinds) and SHALL list the files it would write: with `--over` only the missing ones
  outside `src/`, and for a service in a folder with no workspace the workspace's root files too.
- **FR-007**: THE package template SHALL author its config as the `Config` kind with an options schema and its root
  module as the `Module` kind, and SHALL author no `tsdown.config.ts` or `vitest.config.ts` (gen writes them).

## Acceptance criteria

- **AC-001**: WHEN the workspace has its own `tools/scaffold/templates` THE `scaffoldTemplates` function SHALL return
  that folder.
- **AC-002**: WHEN the workspace has no templates THE `scaffoldTemplates` function SHALL return the shipped copy under
  the `@stackra/cli` package root.
- **AC-003**: IF neither templates folder exists THEN THE `scaffoldTemplates` function SHALL throw an error naming both.
- **AC-004**: THE `@stackra/cli` build SHALL copy core's templates to `dist/scaffold-templates`, inside the published
  `files`.
- **AC-005**: WHEN a template names a catalog that lacks the package THE `retargetCatalogs` function SHALL repoint it at the catalog holding it, and return those no catalog holds as `missing`.
- **AC-006**: WHEN a package is rendered into a product THE `scaffold` function SHALL name it after the product and take
  the framework from `catalog:stackra`.
- **AC-007**: WHEN `--dry-run` is given THE `new` command SHALL leave the workspace unchanged for every kind and print
  the files it would write.
- **AC-008**: WHEN a standard category's folder is missing THE `new` command SHALL create it with the package.
- **AC-009**: IF a non-standard category's folder is missing THEN THE `new` command SHALL refuse, naming the standard
  categories.
- **AC-010**: THE package template SHALL render a member whose gen, typecheck, test and build pass without authored
  tsdown or vitest configs.

## Success Criteria

- **SC-001**: `scaffold-templates.function.test.ts`, `retarget-catalogs.function.test.ts`,
  `cli-package-root.function.test.ts`, `scaffold.test.ts` and `new-command.constant.test.ts` pass and prove AC-001 to
  AC-009 — verified by: unit
- **SC-002**: on box 2, a minimal app made by `stackra create` from the packed tarballs renders `package`, `package
--entries react --data`, `app:docs` and `app:console` from the shipped copy; dry runs leave git clean; the packages
  install, gen, typecheck, test and build; the docs app gens (AC-010) — verified by: manual
- **SC-003**: the `@stackra/cli` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Design

### Summary

The CLI ships core's templates; `scaffold` picks the workspace's own first; the rendered member takes the target's
names and catalogs; `new` handles a created app's empty `packages/` and honours `--dry-run` for every kind.

### Architecture overview

`scaffold` asks `scaffoldTemplates(home)` for its template folder instead of joining `tools/scaffold/templates`.
`scaffoldTemplates` finds the shipped copy through `cliPackageRoot()` (which `cliVersion` now uses too). After
rendering a package, `scaffold` sets its name from `memberNaming` and passes the manifest through `retargetCatalogs`
with the target's `pnpm-workspace.yaml`; `new` prints the `missing` list. `new` lists `dryRunPaths` and returns before
any write when `--dry-run` is set.

### Components and responsibilities

- `scaffoldTemplates`: chooses the template folder (authored first, shipped second, else a clear error).
- `cliPackageRoot`: the folder of the installed `@stackra/cli`, walking up from the module (works from `src/` and
  `dist/`).
- `retargetCatalogs`: pure; rewrites catalog references to the target's catalogs and reports the missing ones.
- `NEW_COMMAND`: creates a standard category's folder, lists `--dry-run` files for every kind, prints `missing`.
- The build (`tsdown.config.ts` `copy`) and `turbo.jsonc` inputs ship and track the templates.

```ts
export const SCAFFOLD_TEMPLATE_PATHS: Readonly<{ repository: string; shipped: string }>;
export function scaffoldTemplates(home: string, shipped?: string): string;
export function cliPackageRoot(from?: string): string;
export function retargetCatalogs(
  manifest: Readonly<Record<string, unknown>>,
  workspace: string,
): { manifest: Record<string, unknown>; missing: string[] };
export function scaffold(options: ScaffoldOptions): {
  dest: string;
  rel: string;
  files: string[];
  missing: string[];
};
```

### Files and folders

```text
packages/developer/cli/
├── README.md
├── tsdown.config.ts
├── turbo.jsonc
└── src/node/
    ├── constants/new-command.constant.ts
    ├── constants/__tests__/new-command.constant.test.ts
    ├── functions/cli-package-root.function.ts
    ├── functions/cli-version.function.ts
    ├── functions/__tests__/cli-package-root.function.test.ts
    └── scaffold/
        ├── constants/scaffold-template-paths.constant.ts
        ├── functions/retarget-catalogs.function.ts
        ├── functions/scaffold-templates.function.ts
        ├── functions/scaffold.function.ts
        ├── functions/__tests__/retarget-catalogs.function.test.ts
        ├── functions/__tests__/scaffold-templates.function.test.ts
        ├── functions/__tests__/scaffold.test.ts
        └── types/scaffold-options.type.ts
tools/scaffold/templates/packages/
├── README.md
└── package/
    ├── AGENTS.md
    ├── package.json
    ├── tsdown.config.ts (removed)
    ├── vitest.config.ts (removed)
    └── src/
        ├── config/          {{NAME}}.config.ts and its test (the Config kind)
        ├── core/schemas/    {{NAME}}-options.schema.ts (new: the options fields)
        └── node/            {{NAME}}.module.ts and its test (the Module kind)
apps/docs/src/docs/guides/scaffolding.mdx
.changeset/cli-new-in-a-created-app.md
```

The two files marked removed are deleted: gen writes a package's tsdown and vitest configs.

### Data models and migrations

none

### Contracts

none public (the CLI exports no code). The `stackra new` flags are unchanged; `scaffold` (internal) also returns
`missing`.

### Error handling

`scaffoldTemplates` throws naming both folders and "reinstall @stackra/cli"; an unknown missing category is a
`CliUsageError` naming `CATEGORY_NAMES`; a catalog no catalog holds is a printed note, not an error.

### Security and tenancy

none: no tenant data, no secret; writes stay inside the one member folder (and a standard category folder).

### Testing strategy

Unit tests per AC (listed in Tasks), each failing without its change; the box 2 run of SC-002 for AC-010.

### Rollout

A minor changeset for `@stackra/cli`; created apps get the behaviour when they take the next CLI release. Core keeps
its own templates, so nothing changes there.

## Tasks

- [x] T001 `scaffoldTemplates`, `SCAFFOLD_TEMPLATE_PATHS` and their tests in `packages/developer/cli/src/node/scaffold/functions/scaffold-templates.function.ts` and `packages/developer/cli/src/node/scaffold/constants/scaffold-template-paths.constant.ts` — covers: FR-001, AC-001, AC-002, AC-003
- [x] T002 `cliPackageRoot` (and `cliVersion` on it) with tests in `packages/developer/cli/src/node/functions/cli-package-root.function.ts` and `packages/developer/cli/src/node/functions/cli-version.function.ts` — covers: FR-001, AC-002
- [x] T003 Ship and track the templates in `packages/developer/cli/tsdown.config.ts` and `packages/developer/cli/turbo.jsonc`, with "the build" test in `packages/developer/cli/src/node/scaffold/functions/__tests__/scaffold-templates.function.test.ts` — covers: FR-002, AC-004
- [x] T004 `retargetCatalogs` and its tests in `packages/developer/cli/src/node/scaffold/functions/retarget-catalogs.function.ts` — covers: FR-004, AC-005
- [x] T005 `scaffold` renders from `scaffoldTemplates`, names the package and retargets catalogs in `packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts`, with the `home` doc in `packages/developer/cli/src/node/scaffold/types/scaffold-options.type.ts` — covers: FR-001, FR-003, FR-004, AC-002, AC-005, AC-006
- [x] T006 Category folders, `--dry-run` for every kind and the `missing` note in `packages/developer/cli/src/node/constants/new-command.constant.ts`, tested in `packages/developer/cli/src/node/constants/__tests__/new-command.constant.test.ts` — covers: FR-005, FR-006, AC-007, AC-008, AC-009
- [x] T007 The package template's `Config` and `Module` kinds and options schema, no tsdown or vitest config, in `tools/scaffold/templates/packages/package/src/config/{{NAME}}.config.ts` and `tools/scaffold/templates/packages/package/src/node/{{NAME}}.module.ts`, the schema in `tools/scaffold/templates/packages/package/src/core/schemas/{{NAME}}-options.schema.ts`, the dependencies in `tools/scaffold/templates/packages/package/package.json` and `tools/scaffold/templates/packages/package/AGENTS.md`, and `tools/scaffold/templates/packages/package/tsdown.config.ts` and `tools/scaffold/templates/packages/package/vitest.config.ts` removed — covers: FR-007, AC-010
- [x] T008 Docs: `apps/docs/src/docs/guides/scaffolding.mdx`, `packages/developer/cli/README.md`, `tools/scaffold/templates/packages/README.md` and `.changeset/cli-new-in-a-created-app.md` — covers: SC-002, AC-004, AC-007

## Out of scope

- Moving `tools/scaffold/templates` into the CLI package (core keeps authoring them where they are).
- Adding the missing catalog entries for the developer (`stackra new` names them; the developer adds them).

## Assumptions

- A created app's `pnpm-workspace.yaml` uses `catalog:` for React and `catalog:stackra` for the framework, as the
  Stackra template writes it.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-1954 session) · created from the branch's commit `2f159d40f` after review
- 2026-11-26 · Draft → Clarified · Claude (STA-1954 session) · Impact answered from the diff
- 2026-11-26 · Clarified → Planned · Claude (STA-1954 session) · `## Design` written from what was built
- 2026-11-26 · Planned → Tasked · Claude (STA-1954 session) · `## Tasks`
- 2026-11-26 · Tasked → Implementing · Claude (STA-1954 session) · T001 to T008 committed on the branch (`2f159d40f`)

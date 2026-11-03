# Implementation Plan: imports-map drift check

**Spec**: `.agents/specs/sta-2072-imports-map-drift/spec.md` · **Linear**: STA-2072 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2072-imports-map-drift/spec.md`

## Summary

ADR 0233 says a member's `imports` map is generated, but only `stackra new` writes one, once, and nothing checks it;
120 of 123 members already drift. One pure builder, `importsMap(dir)`, derives the map from the member's folders. The
scaffold writes it, a new `stackra validate --repository` check compares every member's map with it, and every
member's map on main is regenerated once so the check passes. The rule keeps every key and every first target members
have today and only adds aliases and fallback targets, so no specifier that resolves today resolves differently.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/cli` (`tier:lib`); the `package.json` of every member under `apps/*`,
  `packages/*/*` (not `packages/tooling/*`), `services/*` and `workers/*` (`imports` field only)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none
- **Runtime target**: a library (the CLI's node entry), run by `pnpm validate` and `stackra new`

## Constitution Check

| Law                                   | Result | Note                                                                                 |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI reads member folders; no member imports another's source                     |
| Secrets (ADR 0009)                    | PASS   |                                                                                      |
| Security                              | PASS   | reads the checkout only                                                              |
| HTTP and events                       | N/A    | no action, query, endpoint or event changes                                          |
| Tenancy                               | N/A    | no table or scope change                                                             |
| Delegation                            | PASS   |                                                                                      |
| Not built yet (ADR 0011)              | PASS   | no writer command; the finding names each alias to change                            |
| Test placement (ADR 0022)             | PASS   | `src/node/functions/__tests__/imports-map.function.test.ts` beside the two functions |
| Versions and catalogs                 | PASS   | no dependency, catalog or lockfile change                                            |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                    |
| Licence tier (ADR 0077)               | PASS   | free                                                                                 |
| Docs and ADRs                         | PASS   | ADR 0233 Enforcement and the CLI README row; no new ADR (ADR 0233 decision 1 rules)  |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | same: a repository check and `package.json` |
| On-prem    | same                                        |
| Air-gapped | same                                        |

## Correctness properties

- **P-001**: For any member folder, `importsMap(dir)` is a function of its folder names only (same tree, same map) —
  Validates: FR-001, FR-002, FR-003
- **P-002**: The check reports a member exactly when its map and the generated map differ as key-to-targets sets —
  Validates: FR-004, FR-005
- **P-003**: For every member on main, the regenerated map keeps every existing key and every first target —
  Validates: FR-007

## Architecture overview

```
member folder (src/*, plugin/, scripts/) ──► importsMap(dir) ──┬──► scaffold: pkg.imports = importsMap(dest)
                                                               └──► importsMapFindings(root): package.json "imports" ≠ map
                                                                     └──► VALIDATE_COMMAND --repository findings
```

## Components and responsibilities

- `importsMap` (new, `packages/developer/cli/src/node/functions/imports-map.function.ts`): pure over the folder
  names; returns `Record<string, string | string[]>`. Holds the four-target `aliasOf` moved from the scaffold.
- `importsMapFindings` (new, `packages/developer/cli/src/node/functions/imports-map-findings.function.ts`): for each
  `readManifestMembers(root)` member whose `stackra.tier` is not `config`, compares `manifest.imports` with
  `importsMap(join(root, dir))` ignoring key order, and returns one `DirFinding` naming the aliases to add, remove and
  retarget.
- `VALIDATE_COMMAND` (`packages/developer/cli/src/node/constants/validate-command.constant.ts`): adds
  `...importsMapFindings(root)` and the check to its contract comment.
- `scaffold` (`packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts`): drops `aliasOf` and
  `packageImports`, and sets `pkg.imports = importsMap(dest)` for every kind but `tooling`, after the templates render.

## Files and folders

`packages/developer/cli`:

- `src/node/functions/imports-map.function.ts` (new)
- `src/node/functions/imports-map-findings.function.ts` (new)
- `src/node/functions/__tests__/imports-map.function.test.ts` (new)
- `src/node/constants/validate-command.constant.ts`
- `src/node/scaffold/functions/scaffold.function.ts` and `src/node/scaffold/functions/__tests__/scaffold.test.ts`
- `README.md` (the `validate --repository` row)

Repository:

- `tools/scaffold/templates/apps/{console,desktop,mobile}/package.json`: the `imports` field goes (the scaffold
  writes it).
- The `imports` field of every checked member's `package.json`, regenerated once.
- `apps/docs/src/docs/adr/0233-imports-use-subpath-aliases-only.mdx`: Enforcement row.
- `.changeset/sta-2072-imports-map-drift.md` for `@stackra/cli`.

## Data models and migrations

none

## Contracts

- `stackra validate --repository` gains one finding, printed as the others are: `<dir>: package.json "imports" is not
the generated map (ADR 0233 decision 1): add #a/*; remove #b/*; retarget #c/*`, and the exit code 1.
- Members' `imports` maps: additive only (new aliases and fallback targets; no key removed, no first target changed).

## Error handling

A member with no `imports` field is compared as an empty map (EC-07). A missing `src/` gives only the root-folder
aliases and `#stackra/*`. A malformed `package.json` already fails `readManifestMembers`, as for the other checks.

## Security and tenancy

none

## Testing strategy

- AC-001 to AC-003: `imports-map.function.test.ts` builds member folders under a temporary root: a per-folder package
  with `src/__tests__/`, an app with `src/main.ts`, a native package with `plugin/`, and a member with `scripts/`; the
  maps equal literal expected objects. Tests carry `@covers sta-2072:FR-###`.
- AC-004 to AC-006: the same file builds a temporary workspace (`pnpm-workspace.yaml` with `packages/*/*`) with a
  member missing an alias, one with an extra alias, one with a short target list, one equal in another key order, one
  with no `imports`, and a `config`-tier preset; `importsMapFindings` returns exactly the expected findings.
- AC-007: `scaffold.test.ts` asserts the written map equals `importsMap(dest)` for a package and a console app.
- AC-008: on ci-box, `stackra validate --repository` with no imports-map finding; SC-004: typecheck, test and build of
  the members whose `package.json` changed (turbo `--filter=...[origin/main]`).

## Rollout

The builder runs once, from an untracked script on ci-box, over every member; the box prints `git diff` and the patch
is applied in the worktree with `git apply`, then formatted with oxfmt. A patch changeset for `@stackra/cli`. After
merge, `pnpm validate` keeps the maps generated.

## Delegation and risk plan

One agent, one pull request. Every install, typecheck, test and build runs on ci-box. Risks: a session that adds a
member or a `src/` folder before this merges would drift (the check names it; merge `origin/main` in and regenerate
before shipping); the wide `package.json` diff conflicts with any session editing a member's `imports` (same remedy).

## ADRs

ADR 0233 (decision 1: the map is generated; decision 6: tooling exempt; Enforcement), ADR 0006 (rule 5), ADR 0294
(decision 15: one alias per `src/` folder). All Accepted.

## Docs

`apps/docs/src/docs/adr/0233-imports-use-subpath-aliases-only.mdx`: the map check moves from planned to automated
(`importsMapFindings` in `@stackra/cli`); the `#` specifier declaration check stays planned.
`packages/developer/cli/README.md`: the `validate --repository` row names the imports map.

## Complexity tracking

none

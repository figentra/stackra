# Implementation Plan: public core carries no private submodule, and the layout check keeps it so

**Spec**: `.agents/specs/sta-2918-remove-notes-submodule/spec.md` · **Linear**: STA-2918 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2918-remove-notes-submodule/spec.md`

## Summary

Core drops the `.notes` gitlink and `.gitmodules`, and every line that describes the submodule. `@stackra/repo-checks`
gains a pure `.gitmodules` reader, `submodulesOf`, and a check, `checkSubmodules`, that `layoutFindings` runs against
package.json `stackra.layout.submodules`, so `stackra validate --repository` (part of `pnpm verify`) refuses a submodule
nobody declared as public.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/repo-checks`, `packages/developer/flow-preset`, `packages/developer/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`; a repository-level proof with `stackra validate --repository` and an
  anonymous recursive clone on the build machine
- **Storage**: none
- **Runtime target**: the developer machine and CI

## Constitution Check

| Law                                   | Result | Note                                                        |
| ------------------------------------- | ------ | ----------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | repo-checks imports nothing new                             |
| Secrets (ADR 0009)                    | PASS   | no value; a URL's user info is masked in findings           |
| Security                              | PASS   | the public repository no longer names a private repository  |
| HTTP and events                       | N/A    | none                                                        |
| Tenancy                               | N/A    | repository tooling                                          |
| Delegation                            | PASS   | Claude only                                                 |
| Not built yet (ADR 0011)              | PASS   | nothing planned is described as built                       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                   |
| Versions and catalogs                 | PASS   | one changeset: minor repo-checks, patch flow-preset and cli |
| Deploy modes (ADR 0076)               | N/A    | no deploy                                                   |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                   |
| Docs and ADRs                         | PASS   | the docs listed in spec.md; applies ADR 0526 d4, no new ADR |

## Deploy modes

| Mode       | Behaviour                     |
| ---------- | ----------------------------- |
| SaaS       | unchanged; repository tooling |
| On-prem    | unchanged                     |
| Air-gapped | unchanged                     |

## Correctness properties

- **P-001**: for every `.gitmodules` text, `checkSubmodules` reports one finding per submodule that is undeclared, or
  declared with a URL an anonymous clone cannot fetch, and none for a declared https or relative one — Validates:
  AC-002, AC-003, AC-004, AC-005
- **P-002**: every declared path either has a submodule behind it or is reported stale — Validates: AC-006
- **P-003**: no finding text contains a URL's user info — Validates: AC-007
- **P-004**: `submodulesOf` returns exactly the `submodule` sections, in file order, each with a path (the name when
  missing) and a url ("" when missing) — Validates: AC-008
- **P-005**: core's tree has no gitlink and no `.gitmodules`, and no doc describes a `.notes` submodule — Validates:
  AC-001, AC-009

## Architecture overview

`stackra validate --repository` → `layoutFindings(context)` → reads `flow.config.json`, `package.json`,
`pnpm-workspace.yaml` and now `.gitmodules` → `checkRepositoryLayout(…)` and `checkSubmodules(text,
stackra.layout.submodules)` → `submodulesOf(text)` → findings under the `layout` rule.

## Components and responsibilities

- `submodulesOf`: parses git's config syntax for `[submodule "<name>"]` sections (`path`, `url`; comments, quotes,
  other sections).
- `checkSubmodules`: the policy: declared with a reason, fetchable anonymously, no stale declaration, user info masked.
- `layoutFindings`: reads `.gitmodules` and `stackra.layout.submodules` and runs the check beside the layout check.
- Repository: removes the gitlink, `.gitmodules`, the two `stackra.layout.allow` entries and the submodule's
  descriptions; `.gitignore` ignores a `.notes/` folder an old checkout leaves behind.

## Files and folders

```text
packages/developer/repo-checks/
  README.md
  src/node/index.ts
  src/node/functions/check-submodules.function.ts
  src/node/functions/submodules-of.function.ts
  src/node/functions/layout-findings.function.ts
  src/node/functions/__tests__/check-submodules.function.test.ts
  src/node/functions/__tests__/submodules-of.function.test.ts
  src/node/functions/__tests__/layout-findings.function.test.ts
  src/node/types/submodule.type.ts
packages/developer/flow-preset/
  preset/rules/workspace-layout.md
  preset/skills/mobile-eas-setup/SKILL.md
packages/developer/cli/
  src/node/python-placement/functions/python-placement-findings.function.ts
.flow/
  lock.json
  overrides/rules/workspace-layout.md
  overrides/skills/mobile-eas-setup.md
.agents/
  rules/workspace-layout.md
  skills/mobile-eas-setup/SKILL.md
.github/workflows/
  apply-observability.yml
  ci.yml
  linear-sync.yml
  release.yml
  runway-cloudflare-workers.yml
  runway-npm.yml
docs/
  repository-guide.md
.changeset/no-private-submodules.md
.gitignore
.gitmodules
.notes
.oxfmtrc.jsonc
.oxlintrc.jsonc
AGENTS.md
STATE.md
flow.config.json
package.json
```

## Data models and migrations

None.

## Contracts

Additive exports from `@stackra/repo-checks`: `checkSubmodules(text: string | undefined, declared?: Record<string,
string>): string[]`, `submodulesOf(text: string): Submodule[]`, `type Submodule = { name; path; url }`. package.json
`stackra.layout.submodules` is an optional `{ "<path>": "<reason anyone can clone it>" }` map.

## Error handling

A finding is a `layout` line; `stackra validate --repository` exits non-zero on any finding, as for every rule. A
missing `.gitmodules` is no submodule.

## Security and tenancy

The finding masks a URL's user info. Tenancy: none.

## Testing strategy

- AC-002 to AC-007: `check-submodules.function.test.ts`; AC-003 end to end through `layout-findings.function.test.ts`.
- AC-008: `submodules-of.function.test.ts`.
- AC-001, AC-009: the proof on the build machine (`git ls-tree`, an anonymous `git clone --recursive`, `git grep`),
  and `stackra validate --repository` before and after (SC-002).
- Each behaviour test fails with its change reverted (the revert run is in the pull request).

## Rollout

One changeset: minor `@stackra/repo-checks`, patch `@stackra/flow-preset` and `@stackra/cli` (the versions are fixed
across `@stackra/*`). Rolling back is reverting the commit; the notes repository is untouched.

## Known risks

- A consumer repository that keeps a public submodule gets a new finding until it declares the path; the message says
  how.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

Applies ADR 0526 decision 4 to submodules; no new ADR.

## Docs

The files listed under "Docs to update" in spec.md.

## Complexity tracking

none

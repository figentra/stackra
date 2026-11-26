# Implementation Plan: a TypeScript API reference generated from TSDoc, with the package index kept in sync

**Spec**: `.agents/specs/sta-2857-api-reference/spec.md` · **Linear**: STA-2857 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2857-api-reference/spec.md`

## Summary

`apps/docs/scripts/api-reference` reads every published package's `package.json` and, with one TypeScript program
(`typescript6`, as in `@stackra/gen`), the exported names of each `exports` entry. It renders the package index and one
page per package (one per entry point past 500 names) and writes them under `src/docs/customers`. `--check` compares
instead of writing; `pnpm validate` runs it, and the release version step (`changeset:version`) regenerates the pages
after the bump, so the version printed in the index and in each page header stays current.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (type stripping: the scripts run as `node <file>.ts`)
- **Members**: `apps/docs` (`@figentra/docs`, private); the root `package.json`
- **Testing**: vitest in `scripts/api-reference/__tests__/` (ADR 0022), throwaway repositories in a temporary folder
- **Storage**: none
- **Runtime target**: node (a build-time script); the pages are static MDX

## Constitution Check

| Law                                   | Result | Note                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the app reads package sources from disk; no package imports the app |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                          |
| Security                              | PASS   | only shipped declarations and TSDoc; `@internal` and private hidden |
| HTTP and events                       | N/A    | no route, header or event                                           |
| Tenancy                               | N/A    | no tenant data                                                      |
| Delegation                            | PASS   | one session, one branch                                             |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside the scripts                            |
| Versions and catalogs                 | PASS   | `typescript6` from the `tooling` catalog                            |
| Deploy modes (ADR 0076)               | PASS   | static pages, same in all three                                     |
| Licence tier (ADR 0077)               | PASS   | free                                                                |
| Docs and ADRs                         | PASS   | README and AGENTS.md; follows ADR 0007 and ADR 0514                 |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | the docs site serves the generated pages as static MDX           |
| On-prem    | same; the pages ship with the docs site, nothing runs at request |
| Air-gapped | same; the generator reads the local sources and needs no network |

## Correctness properties

- **P-001**: for every package under `packages/<category>/<name>` whose manifest is not `private`, the index lists it and every `code` entry of its `exports` is read from source — Validates: FR-001
- **P-002**: for every exported name that is not `@internal`, its page prints its declaration without bodies, initializers or private members, with its TSDoc; a name declared by another package is a re-export of it — Validates: FR-002
- **P-003**: a package with more than 500 names gets one page per entry point besides `.`, and every page links back to the package page — Validates: FR-003
- **P-004**: `--check` writes nothing and fails exactly when a generated page is missing, differs or is stale — Validates: FR-004
- **P-005**: `changeset:version` ends with the regeneration, so its output passes `--check` — Validates: FR-005

## Architecture overview

`listPackages` (manifests) → `readPackageApis` (one `ApiReader` program over every entry file) → `renderApiReference`
(`renderPackageIndex` and `renderReferencePages`, pure) → `writeApiReference` (write, remove stale pages, or `--check`
via `driftOf`). MDX safety lives in `prose`, `cell`, `inlineCode` and `codeBlock`.

## Files and folders

```text
apps/docs/
├── AGENTS.md
├── README.md
├── package.json
├── vitest.config.ts
├── scripts/api-reference/        (the generator and its __tests__)
└── src/
    ├── config/docs.config.ts
    └── docs/customers/
        ├── packages.mdx          (generated)
        └── reference/*.mdx       (generated)
.oxfmtrc.jsonc
package.json
```

## Contracts

- `pnpm --filter @figentra/docs api-reference` (write) and `api-reference:check` (compare); `pnpm validate` runs the
  check; `changeset:version` ends with the write.
- No published package's contract changes.

## Error handling

A `code` entry whose file is missing throws (the package's `exports` points nowhere). The check prints each drifted page
(`missing`, `changed`, `stale`) and the command that regenerates them.

## Testing strategy

- AC-001: `api-reference.test.ts` ("writes the pages, then its check passes until a package changes, …") and
  `driftOf`'s test.
- AC-002: `release-version-step.test.ts` (fails without the step) and the box 2 dry run of `pnpm changeset:version`.
- AC-003: the site build (gen's refusals) and the `.oxfmtrc.jsonc` ignore entries.

## Rollout

Merged with the pages generated. The next "chore(release): version packages" PR regenerates them in the bot's version
script; no changeset (private members only).

## ADRs

ADR 0007 (docblock standard), ADR 0514 (Fumadocs), ADR 0025 (automation prepares the release): all Accepted.

## Docs

`apps/docs/README.md`, `apps/docs/AGENTS.md`.

## Complexity tracking

none

# Implementation Plan: `pnpm new` scaffolds members in the programming model v3 shape

**Spec**: `.agents/specs/sta-347-v3-scaffold/spec.md` · **Linear**: STA-347 · **Date**: 2026-10-23

## Summary

The templates under `tools/scaffold/templates/` move to the v3 member shape (ADR 0294 rule R12, ADR 0295):
`stackra.config.ts`, one root module, group folders, no authored `main.ts` or barrel. `scaffold.mjs` writes a package's
`exports` (one public file per entry) and `imports` from the structure data, and adds `--data`. `structure.mjs` gains
the v3 tables, and `checkService` gets a named v2/v3 transition branch until STA-344.

## Technical Context

- **Language**: Node ESM scripts (`tools/scripts`), TypeScript templates
- **Members**: none changed; `apps/docs` gets the regenerated structure page and the scaffolding guide
- **Testing**: node:test in `tools/scripts/__tests__/` (run by `pnpm validate`); manual scaffold-and-verify of each kind
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | templates keep one tier tag per kind; no workspace dependency added |
| Secrets (ADR 0173)                    | PASS   | `runway.yaml` template holds names only; no value anywhere          |
| Security                              | N/A    | repository tooling; no runtime surface                              |
| HTTP and events                       | N/A    | no action, endpoint or event                                        |
| Tenancy                               | N/A    | no tenant data                                                      |
| Delegation                            | PASS   | one builder; a separate reviewer                                    |
| Not built yet (ADR 0227)              | PASS   | no rejected technology; no `@/` alias, no tsconfig paths            |
| Test placement (ADR 0022)             | PASS   | every template test in `__tests__/`                                 |
| Versions and catalogs                 | PASS   | no new dependency; templates use `catalog:` and `workspace:*`       |
| Deploy modes (ADR 0076)               | N/A    | repository tooling, not deployed                                    |
| Licence tier (ADR 0077)               | PASS   | packages MIT with `LICENSE`, apps and services UNLICENSED           |
| Docs and ADRs                         | PASS   | scaffolding guide, structure page, template READMEs; no ADR needed  |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | none: developer tooling only |
| On-prem    | none: developer tooling only |
| Air-gapped | none: developer tooling only |

## Correctness properties

- **P-001**: A scaffolded package or service has `stackra.config.ts` and its root module, and no `main.ts`, entry barrel or `stackra.manifest.json` — Validates: FR-001, FR-002
- **P-002**: Every package export names a file that exists, and only entries with a file are exported; optional folders appear only on request — Validates: FR-001, FR-003
- **P-003**: An app's root module sits at `src/<name>.module.ts`, and only the marked stand-ins sit beside it; the docs app has neither file — Validates: FR-004
- **P-004**: `checkService` passes a well-formed v2 and v3 service and names the missing file of each shape — Validates: FR-005
- **P-005**: Each v3 suffix has one home per tier except `.change` (modules) and `.error` (apps), and `rootModuleOf` places the root module by tier — Validates: FR-006

## Contracts and events

The `pnpm new` command line: `--entries react,native|none`, `--data`. No runtime contract.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, one wave, separate review. Each kind is scaffolded for real in the worktree and checked (validate,
lint, typecheck, test, build; `expo export` for mobile), then deleted before the commit.

## ADRs

ADR 0294, 0295, 0296 and 0300 (Accepted); no new record.

## Docs

`apps/docs/src/guides/scaffolding.mdx`, `apps/docs/src/standards/structure.mdx` (generated), `tools/scaffold/README.md`,
the template READMEs and AGENTS files, and one sentence each in `.agents/rules/workspace-layout.md`,
`.agents/rules/service-checklist.md` and the `backend-module-and-root-module` skill.

## Project structure

`tools/scripts/{scaffold,structure,validate-repository}.mjs` and their tests, `tools/scaffold/templates/**`,
`knip.jsonc` (the `apps/*` entries), `apps/docs/src/{guides/scaffolding,standards/structure}.mdx`.

# Implementation Plan: `@stackra/ui-pro`, the remaining HeroUI Pro components

**Spec**: `.agents/specs/sta-416-ui-pro-remaining/spec.md` · **Linear**: STA-416 · **Date**: 2026-10-23

## Summary

Every HeroUI Pro component not yet in `@stackra/ui-pro` gets a thin wrapper in STA-403's shape: a contract in
`src/contracts`, a runtime wrapper with the `@stackra/ui` props vocabulary, unit tests, and a playground route (web) or
a mobile review screen (native). The optional Pro peers are pinned so nothing is skipped.

## Technical Context

- **Language**: TypeScript, React 19 (web), React Native 0.86 (native)
- **Members**: `packages/design-system/ui-pro`, `apps/playground`, `apps/mobile`, `apps/docs`, `pnpm-workspace.yaml`
- **Testing**: vitest in `__tests__/` (web in jsdom against the real HeroUI Pro, native against recording stand-ins);
  the playground's all-routes Playwright and axe run
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; only apps import it                                              |
| Secrets (ADR 0173)                    | N/A    | no new secret                                                                |
| Security                              | N/A    | no auth, data or CI change                                                   |
| HTTP and events                       | N/A    | no action, endpoint or event                                                 |
| Tenancy                               | N/A    | no tenant data                                                               |
| Delegation                            | PASS   | package-builders per bundle, frontend and mobile builders; separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no Storybook; web and native code stay separate                              |
| Test placement (ADR 0022)             | PASS   | every test in a `__tests__/` folder beside its subject                       |
| Versions and catalogs                 | PASS   | owner-approved exact pins                                                    |
| Deploy modes (ADR 0076)               | N/A    | a private library and dev-only apps                                          |
| Licence tier (ADR 0077)               | PASS   | HeroUI Pro never committed or bundled; peers MIT, Apache-2.0, BSD-3-Clause   |
| Docs and ADRs                         | PASS   | ADR 0310 decision 12, README and AGENTS                                      |

## Deploy modes

| Mode       | Behaviour                                      |
| ---------- | ---------------------------------------------- |
| SaaS       | none: a private library and dev-only apps      |
| On-prem    | none: a private library and dev-only apps      |
| Air-gapped | none: the Pro build is installed at build time |

## Correctness properties

- **P-001**: Every contract prop reaches HeroUI Pro under its HeroUI name, an unknown prop passes through, and a left-out prop stays absent — Validates: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011
- **P-002**: Every playground route, the new Pro routes included, renders without an axe violation in light, dark, LTR and RTL — Validates: FR-012
- **P-003**: The mobile review area lists one screen per native Pro component and each screen renders it — Validates: FR-013

## Contracts and events

Private surface: `@stackra/ui-pro` `./contracts`, `./react`, `./native`. No runtime contract, no event.

## Data and tenancy

None.

## Delegation and risk plan

R1. The lead pins the catalogs, writes the spec and the barrels, and owns `package.json`. Seven `package-builder`
agents run in parallel, one per bundle, each owning whole component names across web and native so a shared contract
has one author: charts; AI; forms; navigation and overlays; shared data display; web-only data display; native buttons
and date and time. A `frontend-builder` adds the playground routes and a `mobile-builder` the review screens. A separate
`code-reviewer` posts the AI-REVIEW; the owner merges.

## ADRs

ADR 0310 decision 12 (same branch as ADR 0310, not merged yet). ADR 0165, 0197, 0302 and 0303 apply.

## Docs

ADR 0310, the package README and AGENTS.

## Project structure

`packages/design-system/ui-pro/src/{contracts,react,native}`, `apps/playground/src/routes`, `apps/mobile/src/screens/pro`,
`pnpm-workspace.yaml`, `apps/docs/src/adr`.

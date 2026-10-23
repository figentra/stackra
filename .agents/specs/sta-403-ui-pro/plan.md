# Implementation Plan: `@stackra/ui-pro`, private HeroUI Pro wrappers for Stackra's own apps

**Spec**: `.agents/specs/sta-403-ui-pro/spec.md` · **Linear**: STA-403 · **Date**: 2026-10-23

## Summary

A private package, `@stackra/ui-pro`, wraps HeroUI Pro on web and HeroUI Native Pro on native with the `@stackra/ui`
props vocabulary. The validator keeps Pro out of every free package. The playground gets a "Pro" group. CI reads
HeroUI's CI/CD token from Infisical over OIDC for the install, and the release build skips the private package. ADR 0304
records it.

## Technical Context

- **Language**: TypeScript, React 19 (web), React Native 0.86 (native)
- **Members**: new `packages/design-system/ui-pro`; changed `apps/playground`, `apps/docs`, `tools/scripts`,
  `.github/workflows/{ci,release}.yml`, `pnpm-workspace.yaml`
- **Testing**: vitest in `__tests__/` (web in jsdom against the real HeroUI Pro, native against recording stand-ins);
  Playwright and axe in `apps/playground/e2e/__tests__/`; `node --test` for the validator
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                                                 |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; imports `@stackra/ui/contracts`, never its `src/`; only apps import it   |
| Secrets (ADR 0173)                    | PASS   | the token is read in CI over OIDC by name; no value is read, printed or stored       |
| Security                              | PASS   | R3: `id-token: write` on the gate job, used only by the Infisical step               |
| HTTP and events                       | N/A    | no action, endpoint or event                                                         |
| Tenancy                               | N/A    | no tenant data                                                                       |
| Delegation                            | PASS   | package-builder (web, native), frontend-builder, docs-adr-steward; separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no Storybook; web and native code stay separate                                      |
| Test placement (ADR 0022)             | PASS   | every test in a `__tests__/` folder beside its subject                               |
| Versions and catalogs                 | PASS   | owner-approved catalog lines, exact pins                                             |
| Deploy modes (ADR 0076)               | N/A    | a private library and a dev-only app                                                 |
| Licence tier (ADR 0077)               | PASS   | HeroUI Pro never committed or bundled; only our own apps (ADR 0197)                  |
| Docs and ADRs                         | PASS   | ADR 0304, the ADR 0197 note, the setup runbook, README and AGENTS                    |

## Deploy modes

| Mode       | Behaviour                                      |
| ---------- | ---------------------------------------------- |
| SaaS       | none: a private library and a dev-only app     |
| On-prem    | none: a private library and a dev-only app     |
| Air-gapped | none: the Pro build is installed at build time |

## Correctness properties

- **P-001**: A non-app member other than `@stackra/ui-pro` that depends on HeroUI Pro or on `@stackra/ui-pro` fails
  `pnpm validate`, and so does `@stackra/ui-pro` without `"private": true` or with a `publishConfig` — Validates: FR-001
- **P-002**: Every contract prop reaches HeroUI Pro under its HeroUI name, an unknown prop passes through, and a
  left-out prop stays absent — Validates: FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010,
  FR-011, FR-012
- **P-003**: Every playground route, Pro routes included, renders without an axe violation in light, dark, LTR and RTL
  — Validates: FR-013
- **P-004**: The gate fails at a named step when the Infisical identity is missing, and the release build never builds
  `@stackra/ui-pro` — Validates: FR-014

## Contracts and events

Private surface: `@stackra/ui-pro` `./contracts`, `./react`, `./native`. No runtime contract, no event.

## Data and tenancy

None.

## Delegation and risk plan

R3 (CI permission). The lead writes the package scaffold, catalogs, validator check, CI wiring and spec;
`package-builder` writes the web and native wrappers in parallel (separate folders); `frontend-builder` the playground
routes and e2e; `docs-adr-steward` ADR 0304. A separate `code-reviewer` posts the AI-REVIEW; the owner merges.

## ADRs

ADR 0304 (new, same pull request), amending ADR 0197 decision 4. ADR 0165, 0197, 0294, 0302 and 0303 apply.

## Docs

ADR 0304, the ADR 0197 note, `apps/docs/src/runbooks/setup.mdx`, the package README and AGENTS.

## Project structure

`packages/design-system/ui-pro`, `apps/playground`, `tools/scripts/validate-repository.mjs`,
`.github/workflows/{ci,release}.yml`, `pnpm-workspace.yaml`, `apps/docs/src/adr`.

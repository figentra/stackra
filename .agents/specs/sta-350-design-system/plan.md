# Implementation Plan: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Spec**: `.agents/specs/sta-350-design-system/spec.md` · **Linear**: STA-350 · **Date**: 2026-10-23

## Summary

A `design-system` package category is added. `@stackra/tokens` takes the brand tokens as the `stackra` theme and renders
a theme to HeroUI v3 web CSS and to the Uniwind / HeroUI Native theme. `@stackra/ui` carries the shared contracts and
the two providers, one per platform. `apps/playground` renders the foundations on HeroUI v3 with a theme and direction
switcher and is covered by Playwright and axe. `@stackra/brand` is deleted; its assets move to `apps/docs` and
`apps/mobile`. ADR 0302 records the five owner decisions.

## Technical Context

- **Language**: TypeScript, CSS generated from theme data, Vite and React Router (playground)
- **Members**: new `packages/design-system/{tokens,ui}` and `apps/playground`; changed `apps/mobile` and `apps/docs`;
  deleted `packages/experience/brand`
- **Testing**: vitest in each package's `__tests__/`; Playwright and axe e2e in `apps/playground/src/**/__tests__/`
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                                                            |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tokens and ui are `tier:lib`; the playground is `tier:app` and imports only packages            |
| Secrets (ADR 0173)                    | N/A    | no secret is read or written                                                                    |
| Security                              | N/A    | no auth, tenant data or outbound call                                                           |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                    |
| Tenancy                               | N/A    | no tenant data                                                                                  |
| Delegation                            | PASS   | package-builder, frontend-builder, test-engineer and docs-adr-steward; a separate reviewer      |
| Not built yet (ADR 0227)              | PASS   | no Storybook; the shared web and native component library stays deferred (contract shared only) |
| Test placement (ADR 0022)             | PASS   | every test, e2e included, in a `__tests__/` folder beside its subject                           |
| Versions and catalogs                 | PASS   | the `e2e` catalog is owner-approved and pinned exactly; every member uses `catalog:`            |
| Deploy modes (ADR 0076)               | N/A    | libraries and a dev-only app, not deployed                                                      |
| Licence tier (ADR 0077)               | PASS   | packages MIT with `LICENSE`; brand assets stay under the ADR 0024 NOTICE                        |
| Docs and ADRs                         | PASS   | ADR 0302, amendment notes, structure page, READMEs, roadmap                                     |

## Deploy modes

| Mode       | Behaviour                                                 |
| ---------- | --------------------------------------------------------- |
| SaaS       | none: libraries and a dev-only app, nothing deployed      |
| On-prem    | none: libraries and a dev-only app, nothing deployed      |
| Air-gapped | none: no network at run time; fonts ship inside the theme |

## Correctness properties

- **P-001**: Every theme has a light and a dark variant for every token, and a renderer fails naming the missing token instead of writing a partial file — Validates: FR-001, FR-003, FR-004
- **P-002**: The `stackra` theme values equal the retired brand tokens, token for token — Validates: FR-002
- **P-003**: A committed generated CSS file equals what the generator prints now — Validates: FR-003, FR-004
- **P-004**: No file outside ADRs and historical specs names `@stackra/brand`, and every moved asset exists in its new home — Validates: FR-005
- **P-005**: A package scaffolded or validated in `design-system` is accepted, and an unknown category still fails — Validates: FR-006
- **P-006**: The `./react` provider puts the colour scheme and `dir` on the document, and the `./native` provider applies the same scheme from the shared contract — Validates: FR-007, FR-008, FR-009
- **P-007**: Every playground route, found by listing the route folders, renders without an axe violation in light, dark, LTR and RTL — Validates: FR-010, FR-011
- **P-008**: For every Size and TextTone, both Icons hand the drawn component the same pixel size (`ICON_SIZES`) and the same colour role — Validates: FR-012
- **P-009**: Decorative is the default on both runtimes: an Icon with no label has no accessible name and is hidden — Validates: FR-013
- **P-010**: Each runtime's Text and Heading props extend their contract (type test) — Validates: FR-017, FR-018, FR-019
- **P-011**: Props outside the contract reach HeroUI unchanged on both runtimes, and the contract-owned HeroUI props cannot be passed — Validates: FR-018, FR-019
- **P-012**: Text in Arabic, by `lang` or by the screen's locale, takes the theme's `-ar` style and other text never does — Validates: FR-019, FR-020
- **P-013**: An Icon is drawn mirrored exactly when it asks for it and the direction is right to left — Validates: FR-014
- **P-014**: The native provider gives Lucide icons the md size and the theme foreground colour — Validates: FR-015
- **P-015**: Every Icon and Typography sample of the playground shows what its contract promises (names, mirroring, sizes, computed type, live state) — Validates: FR-016, FR-021

## Contracts and events

Public surface: `@stackra/tokens` (`./contracts`, the theme, the renderers) and `@stackra/ui` (`./contracts`,
`./react`, `./native`). No runtime contract, no event.

## Data and tenancy

None.

## Delegation and risk plan

R2: the lead splits the work by member; `package-builder` writes tokens and the category tooling, `frontend-builder` the
ui package and the playground, `test-engineer` the e2e, `docs-adr-steward` ADR 0302. A separate reviewer checks the pull
request. Order: the category and tokens first, then ui, then the playground, then the e2e and the brand retirement.

## ADRs

ADR 0302 (new, same pull request); ADR 0165, 0128, 0227, 0300 and 0024 apply and get amendment notes where the owner's
decisions change them.

## Docs

ADR 0302, the regenerated `apps/docs/src/standards/structure.mdx`, the package and category READMEs, the roadmap.

## Project structure

`packages/design-system/{tokens,ui}`, `apps/playground`, `tools/scripts/{structure,validate-repository,scaffold}.mjs`,
`pnpm-workspace.yaml` (the `e2e` catalog), `apps/mobile`, `apps/docs`.

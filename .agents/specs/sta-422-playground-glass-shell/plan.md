# Implementation Plan: Playground glass shell, landing gallery and command palette

**Spec**: `.agents/specs/sta-422-playground-glass-shell/spec.md` · **Linear**: STA-422 · **Date**: 2026-10-24

## Summary

`PlaygroundShell` draws a glass bar, a native `<dialog>` command palette, a category strip and a pager; the index page
draws a wordmark stage, three live scenes and a category gallery; discovery adds a tier; `app.css` holds the glass
material and the ambient field; ADR 0320 records the brand amendment.

## Technical Context

- **Language**: TypeScript, React 19, Tailwind v4, HeroUI v3 through `@stackra/ui`
- **Members**: `apps/playground`, `apps/docs`, `packages/design-system/tokens` (one brand record line)
- **Testing**: vitest in `src/**/__tests__/`, Playwright and axe in `e2e/__tests__/`
- **Storage**: none
- **Runtime target**: the browser (Vite dev and preview)

## Constitution Check

| Law                                   | Result | Note                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the wordmark is copied from the docs assets; no app import |
| Secrets (ADR 0173)                    | N/A    | no secret involved                                         |
| Security                              | PASS   | no request, no stored data                                 |
| HTTP and events                       | N/A    | no action or event                                         |
| Tenancy                               | N/A    | no tenant data                                             |
| Delegation                            | PASS   | builder session; separate reviewer                         |
| Not built yet (ADR 0227)              | PASS   | no new technology; `@heroui-pro` not imported              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                      |
| Versions and catalogs                 | N/A    | no dependency change                                       |
| Deploy modes (ADR 0076)               | N/A    | not deployed                                               |
| Licence tier (ADR 0077)               | N/A    | UNLICENSED member, not distributed                         |
| Docs and ADRs                         | PASS   | ADR 0320, playground README                                |

## Deploy modes

| Mode       | Behaviour    |
| ---------- | ------------ |
| SaaS       | not deployed |
| On-prem    | not deployed |
| Air-gapped | not deployed |

## Correctness properties

- **P-001**: A client-side navigation, from a link or the palette, lands focus on the new page's h1 — Validates: FR-001
- **P-002**: A page whose path starts with `/pro-` is Pro and lists after the free pages of its category — Validates: FR-003
- **P-003**: The gallery lists every page under its category and the tier filter narrows it — Validates: FR-002
- **P-004**: Every route passes axe in the four views and more contrast makes the glass opaque — Validates: FR-004

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

ADR 0320 (new): the glass material and the showcase stage.

## Docs

`apps/playground/README.md`.

## Project structure

`apps/playground/src/{components/{playground-shell,command-palette,category-nav,page-pager,page-gallery,page-list,showcase,hero-art,brand-glyph,stackra-wordmark,choice,playground-pages,playground-icons},routes/home,enums,types,styles}`.

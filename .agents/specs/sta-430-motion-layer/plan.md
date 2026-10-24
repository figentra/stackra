# Implementation Plan: the motion layer

**Spec**: `.agents/specs/sta-430-motion-layer/spec.md` · **Lane**: lite · **Change risk**: R1

## Summary

Two motion steps join the Stackra theme, and `motionTiming` reads them for JavaScript animation libraries. `@stackra/ui`
gets `Reveal` on Motion and Reanimated, and `List` reveals its rows with it. `@stackra/ui-pro` turns animation on
where HeroUI Pro and HeroUI Native Pro leave it off: the KPI sparkline, the native chart series and the web
`NumberValue`. ADR 0329 records the layer, the defaults that already comply and the glass rules.

## Technical Context

- Web: Motion 12 (`motion/react`), Recharts through HeroUI Pro, `@number-flow/react` 0.6.
- Native: Reanimated 4 layout animations, victory-native through HeroUI Native Pro.
- `web.css` is a byte-for-byte snapshot of `renderWebCss`, updated with the new steps.

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` packages; `@stackra/tokens` is below `ui` and `ui-pro` |
| Secrets (ADR 0173)                    | N/A    | no secret                                                         |
| Security                              | N/A    | no auth, data or CI change                                        |
| HTTP and events                       | N/A    | no action, endpoint or event                                      |
| Tenancy                               | N/A    | no tenant data                                                    |
| Delegation                            | PASS   | builder ds-pro; separate code-reviewer                            |
| Not built yet (ADR 0227)              | PASS   | nothing on the list                                               |
| Test placement (ADR 0022)             | PASS   | every test in a `__tests__` folder beside its subject             |
| Versions and catalogs                 | PASS   | `catalog:frontend` and `workspace:*` only                         |
| Deploy modes (ADR 0076)               | N/A    | libraries                                                         |
| Licence tier (ADR 0077)               | PASS   | MIT libraries; no HeroUI Pro code copied                          |
| Docs and ADRs                         | PASS   | ADR 0329, the index, the navigation and the tokens README         |

## Deploy modes

| Mode       | Behaviour                          |
| ---------- | ---------------------------------- |
| SaaS       | none: libraries                    |
| On-prem    | none: libraries                    |
| Air-gapped | none: no fetch, timings are inline |

## Correctness properties

- **P-001**: Every new duration is `0ms` under reduced motion, and every animated default is still under reduced motion — Validates: FR-001, FR-004
- **P-002**: A caller's own animation props always win over a default — Validates: FR-005, FR-006, FR-007, FR-008

## Delegation and risk plan

R1: one builder and an independent code-reviewer (AI-REVIEW), merged through `pnpm pr:merge`.

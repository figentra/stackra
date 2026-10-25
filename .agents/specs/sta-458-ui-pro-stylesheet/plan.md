# Implementation Plan: `@stackra/ui-pro/css` and a Pro CSS variable check

**Spec**: `.agents/specs/sta-458-ui-pro-stylesheet/spec.md` · **Lane**: lite · **Change risk**: R1

## Summary

Move #131's HeroUI Pro fixes into `packages/design-system/ui-pro/assets/public/css/ui-pro.css`, exported as `./css`.
The fixes keep their rules but use theme variables only: the file badges take the status colours instead of Tailwind
shades, and the code token cap skips any dark ancestor. A node unit test reads the installed stylesheets an app
imports and checks the variables, classes and `data-*` values.

## Technical Context

- CSS over HeroUI Pro 1.0.0-beta.10's BEM classes. HeroUI Pro's rules sit in `@layer components`, so the stylesheet is
  imported unlayered after `@heroui-pro/react/css`.
- The test runs in vitest in node and resolves `@heroui-pro/react/css`, `tailwindcss/theme.css`, `@heroui/styles`
  themes and `@stackra/tokens/themes/stackra/web.css` with `require.resolve`.

## Constitution Check

| Law                                   | Result | Note                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; a dev dependency on `@stackra/tokens` only   |
| Secrets (ADR 0173)                    | N/A    | no secret                                                |
| Security                              | N/A    | no auth, data or CI change                               |
| HTTP and events                       | N/A    | no action, endpoint or event                             |
| Tenancy                               | N/A    | no tenant data                                           |
| Delegation                            | PASS   | builder ds-pro; separate code-reviewer                   |
| Not built yet (ADR 0227)              | PASS   | nothing on the list                                      |
| Test placement (ADR 0022)             | PASS   | `src/react/__tests__/heroui-pro-css-variables.test.ts`   |
| Versions and catalogs                 | PASS   | `workspace:*` only                                       |
| Deploy modes (ADR 0076)               | N/A    | a private library                                        |
| Licence tier (ADR 0077)               | PASS   | no HeroUI Pro code copied; the stylesheet is our own CSS |
| Docs and ADRs                         | PASS   | README import order; no ADR needed                       |

## Deploy modes

| Mode       | Behaviour                 |
| ---------- | ------------------------- |
| SaaS       | none: a private library   |
| On-prem    | none: a private library   |
| Air-gapped | none: plain CSS, no fetch |

## Correctness properties

- **P-001**: Every colour `ui-pro.css` sets is a theme variable or derived from one — Validates: FR-001
- **P-002**: Every variable HeroUI Pro and `ui-pro.css` read is defined, and every class and `data-*` value it targets exists — Validates: FR-002

## Delegation and risk plan

R1: one builder and an independent code-reviewer (AI-REVIEW), merged through `pnpm pr:merge`.

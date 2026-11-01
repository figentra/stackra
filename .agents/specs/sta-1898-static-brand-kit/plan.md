# Implementation Plan: The static Worker serves the brand kit images

**Spec**: `.agents/specs/sta-1898-static-brand-kit/spec.md` · **Linear**: STA-1898 · **Date**: 2026-11-01

## Summary

`brand-pins.yaml` pins kits. `runway-cloudflare-workers.yml` gets an optional `brand-pins` input: a `create-github-app-token`
step (repositories `brand`, contents read) and a pull step that extracts the `include` globs from each kit's tarball into
`<member>/.brand/<kit>/<ref>/`. `src/main.ts` copies `.brand/` to `dist/site/brand`; `renderHeaders` adds `/brand/*` as
immutable. `deploy-static.yml` sets the input, passes the two App secrets and names the pin file in `paths`.

## Technical Context

- **Language**: TypeScript on Node 24 (the existing builder); shell and `yq` in the workflow
- **Members**: `workers/static`
- **Testing**: vitest in `workers/static/src/site/__tests__/`; the pull is checked by the first CI deploy
- **Runtime target**: Cloudflare Workers static assets (no Worker script)

## Constitution Check

| Law                      | Result | Note                                                                         |
| ------------------------ | ------ | ---------------------------------------------------------------------------- |
| Secrets (ADR 0173)       | PASS   | names only; token minted per job, one step, revoked at job end               |
| CI policy (ADR 0166/7)   | PASS   | action pinned by SHA, least permission (`contents: read`), no PR-time deploy |
| Boundaries               | PASS   | no import change                                                             |
| Not built yet (ADR 0227) | PASS   | no new technology                                                            |
| Test placement (0022)    | PASS   | tests in `__tests__/`                                                        |
| Brand ADR 0001           | PASS   | pulled at deploy, never committed                                            |

## Deploy modes

| Mode       | Behaviour                             |
| ---------- | ------------------------------------- |
| SaaS       | served by the `stackra-static` Worker |
| On-prem    | not deployed                          |
| Air-gapped | not deployed                          |

## Correctness properties

- **P-001**: one immutable `/brand/*` rule, counted against the cap — Validates: FR-003

## Contracts and events

New paths `/brand/<kit>/<ref>/<path in the kit>`; the existing ones are unchanged.

## Data and tenancy

None.

## Delegation and risk plan

R2: one builder; `code-reviewer` and `security-tenancy-reviewer` (new token in CI), then `release-operations`. One wave.

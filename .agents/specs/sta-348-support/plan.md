# Plan: `@stackra/support` wave 1a

**Spec**: `.agents/specs/sta-348-support/spec.md`

## Design

- One file, `src/core/constants/time.constant.ts`, exports one declaration: the frozen `time` object. Its members
  share one private `shift(date, amount, unitMs)` that validates and returns `new Date(start + amount × unitMs)`.
- Units are fixed millisecond lengths. A `Date` is a UTC instant, so adding whole days moves the UTC calendar date
  and is immune to local daylight-saving changes.
- `.` points at that file through the `@stackra/source` condition and the tsdown `index` entry until gen writes the
  entry barrel (STA-339).
- Tool configs (`tsdown.config.ts`, `vitest.config.ts`) follow the scaffold template until gen writes them.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/support`; no workspace runtime import (dev edges only to `@stackra/testing` and the tooling presets); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                      |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                    |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                             |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                           |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                   |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                         |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                        |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                          |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                  |

- Boundaries: no workspace runtime import; dev-only `@stackra/testing` and tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: `time` is camelCase because it is the namespace the template calls, documented in its TSDoc.

## Properties

- **P-001**: For every member and every finite amount, the result differs from the input by `amount × unit` milliseconds (truncated), and the input is unchanged — Validates: FR-002, FR-003
- **P-002**: `subX(d, n)` equals `addX(d, -n)` — Validates: FR-002
- **P-003**: `package.json` names `@stackra/support` at `packages/foundation/support`, `exports` lists only `.`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-004**: every `time` helper throws a `RangeError` for an invalid `Date` and for a non-finite amount — Validates: FR-004
- **P-005**: `package.json` has no `dependencies`, no `peerDependencies` and no workspace import at runtime, and every version in it is `catalog:` or `workspace:*` — Validates: FR-005
- **P-006**: every non-test source file opens with the Stackra file contract and has one exported declaration with TSDoc, and every test sits in `__tests__/` and imports from `@stackra/testing` — Validates: FR-006

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

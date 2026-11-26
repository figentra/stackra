# Implementation Plan: the session alone for React, with no `@stackra/ui`

**Spec**: `.agents/specs/sta-2832-identity-react-session/spec.md` · **Linear**: STA-2832 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2832-identity-react-session/spec.md`

## Summary

A stand-in barrel `src/react/session/index.ts` re-exports the hook, the gate and their types. `package.json` maps
`./react/session` to it and tsdown builds it as `react-session`, beside `react`. `./react` is unchanged apart from its
contract text. A test follows the entry's value imports through the package's own sources and fails on any UI package.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/security/identity` (security)
- **Testing**: vitest in `src/**/__tests__/`; the built `dist/react-session.mjs` checked on box 2
- **Storage**: none
- **Runtime target**: React DOM and React Native (the hook is isomorphic)

## Constitution Check

| Law                                   | Result | Note                                                    |
| ------------------------------------- | ------ | ------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                           |
| Secrets (ADR 0009)                    | N/A    | none                                                    |
| Security                              | PASS   | the same hook and gate; the producer still checks calls |
| HTTP and events                       | N/A    | none                                                    |
| Tenancy                               | N/A    | none                                                    |
| Delegation                            | PASS   | Claude only                                             |
| Not built yet (ADR 0011)              | PASS   | a stand-in barrel until gen writes entries (STA-339)    |
| Test placement (ADR 0022)             | PASS   | the test sits in `src/react/session/__tests__/`         |
| Versions and catalogs                 | PASS   | a minor changeset for @stackra/identity                 |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                               |
| Docs and ADRs                         | PASS   | the package AGENTS.md lists the new entry               |

## Deploy modes

| Mode       | Behaviour                        |
| ---------- | -------------------------------- |
| SaaS       | an app may import the lean entry |
| On-prem    | an app may import the lean entry |
| Air-gapped | an app may import the lean entry |

## Correctness properties

- **P-001**: the entry's values are exactly `SessionGate` and `useSession`, and its types equal `./react`'s —
  Validates: AC-001, AC-003
- **P-002**: the value-import walk from `#react/session/index` finds `react` and no UI package, while the same walk
  from `#react/index` finds one — Validates: AC-002

## Architecture overview

`./react/session` → `src/react/session/index.ts` → `use-session.ts` and `session-gate.tsx` → `#core/index` (the
session service, no UI). `./react` → `src/react/index.ts` → the same files plus the kit's blocks → `@stackra/ui/react`.

## Components and responsibilities

- `src/react/session/index.ts`: the stand-in barrel of the new entry.
- `package.json` `exports["./react/session"]` and `tsdown.config.ts` entry `react-session`.
- `src/react/session/__tests__/index.test.ts`: the entry's values, types and external imports.

## Files and folders

```text
packages/security/identity/
  package.json
  tsdown.config.ts
  AGENTS.md
  src/react/index.ts
  src/react/session/index.ts
  src/react/session/__tests__/index.test.ts
.changeset/identity-react-session-entry.md
```

## Data models and migrations

none

## Contracts

`@stackra/identity/react/session` (new): `useSession`, `SessionGate`, `SessionValue`, `SignedInSession`,
`SessionGateProps`. `@stackra/identity/react`: unchanged.

## Error handling

none changed: `useSession` still throws outside a `ContainerProvider` or without a bound `SessionService`.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-003: the entry's `Object.keys` and `expectTypeOf` against `./react`'s types; `./react`'s own index test
  is unchanged.
- AC-002: the import walk over sources; the built `dist/react-session.mjs` checked on box 2 (no `@stackra/ui`).

## Rollout

A minor changeset for `@stackra/identity`. The starter console imports the entry once a release carries it (STA-2827).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

ADR 0294 (decision 15, stand-in barrels per entry); ADR 0206 (decision 8, the session in React); ADR 0504 (module UI
kits stay in `./react`).

## Docs

`packages/security/identity/AGENTS.md` lists the entry.

## Complexity tracking

none

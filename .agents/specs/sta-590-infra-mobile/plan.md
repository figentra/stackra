# Plan: `@stackra/infra-mobile`

**Spec**: `.agents/specs/sta-590-infra-mobile/spec.md`

1. **Member files** copy `@stackra/runway`'s shape: `package.json` (entries `.` and `./node`, `#core` and `#node`
   imports), the `decorators` TypeScript and Vitest presets (the runway source reaches `@stackra/validation`), the
   tsdown entries, `stackra.config.ts` with `definePackage({})`, README, AGENTS, LICENSE and the CHANGELOG stub.
2. **The plan** (`src/core/`) is one pure function over two parsed runways and the identity: it reads each provider
   fact as a literal or a `ref:`, records every failure, then builds the environments in promotion order and the owner
   tasks. The error and the issue type reuse `@stackra/runway`'s `RunwayIssue`.
3. **The Pulumi slice** (`src/node/`) is one function: `ref:<ns>.<key>` reads `new Config(ns).require(key)`, each
   resolved fact meets its pattern, and the resolved plan is returned for the program to export. No component
   resource: it would have no child.
4. **Tests**: the plan over runway documents shaped like the template's (through `parseRunway`, so the fixtures stay
   valid runways), and the slice under `runtime.setMocks` and `runtime.setAllConfig`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-mobile`; workspace imports `@stackra/contracts` and `@stackra/runway` only |
| Secrets (ADR 0173)                    | PASS   | ids only; signing and push credentials stay in EAS, and nothing reads a secret value                                    |
| Security                              | PASS   | stack config values are checked against their shape before a deploy uses them; no cloud call                            |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                            |
| Tenancy                               | N/A    | no tenant data                                                                                                          |
| Delegation                            | PASS   | `package-builder` writes the code and the tests; a separate reviewer and the testing workflow run them                  |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; Pulumi is decided by ADR 0171                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                               |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; `@pulumi/pulumi` goes into the `infra` catalog                                       |
| Deploy modes (ADR 0076)               | PASS   | an infra-time library, identical in SaaS, on-prem and air-gapped                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; free per ADR 0171 decision 5                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                 |

## Deploy modes

| Mode       | Behaviour                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| SaaS       | read by `stackra infra gen` and run inside the generated Pulumi program                    |
| On-prem    | identical: the mobile app still ships through EAS and the stores                           |
| Air-gapped | identical code; the plan reads local files and the slice reads the local stack config only |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node`; `.` exports `mobileInfraPlan`, `MobileOwnerStep` and `MobileInfraInvalidError` and imports no Pulumi; `./node` exports `mobileStack` only — Validates: FR-001
- **P-002**: the template's runways give a plan with the EAS, Apple and Play facts and the preview, staging and production releases; a platform that does not submit needs no store record — Validates: FR-002
- **P-003**: signing other than `eas-managed`, a shared EAS environment and a stray surface bundle id are refused, each with its path; surfaces get `group.<bundleId>` — Validates: FR-003
- **P-004**: the owner tasks follow `MobileOwnerStep` order, one `ios_signing` per bundle id, with the config key of each `ref:` — Validates: FR-004
- **P-005**: `mobileStack` resolves refs from the stack config, fails naming an unset or malformed key, and registers no resource under Pulumi mocks — Validates: FR-005
- **P-006**: no file here reads a secret value or calls a cloud; the facts are ids — Validates: FR-006

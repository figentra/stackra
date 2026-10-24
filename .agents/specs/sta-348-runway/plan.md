# Plan: `@stackra/runway` wave 2

**Spec**: `.agents/specs/sta-348-runway/spec.md`

1. **Schemas as zod constants** (`src/core/constants/`): small parts (port, key, secret names, config values, var
   value, requirement, instances), then the app and service environment and runway schemas, the topology, root
   environment and root runway schemas, and the runway facts schema. Member objects are strict, so root keys fail;
   the root's provider blocks stay open. Enums through `Enum.of` from `@stackra/contracts`; `url()` from
   `@stackra/validation`.
2. **One lookup** (`RUNWAY_SCHEMAS`) feeds `parseRunway` and `runwayJsonSchema`, so the parsed type and the committed
   `schema/<kind>.json` cannot drift; a test compares the files with the derivation.
3. **Placement** is a pure function over a parsed root and a member list, returning every failure.
4. **Facts**: one resolved document shape for `.stackra/dev/ports.json` and for the `__STACKRA_RUNWAY__` define. The
   `.` readers prefer the injected document, then walk up for the dev file through `process.getBuiltinModule`, so the
   entry stays bundle-safe. `definesFor` (`./node`) builds the define map; `devServer` builds the Vite server block.
5. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in wave 1.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/runway`; workspace imports: `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | no secret value is read anywhere; the TLS paths of the dev facts never reach a bundle                                                                      |
| Security                              | PASS   | member schemas refuse unknown keys; dev TLS paths stay out of every bundle                                                                                 |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                               |
| Tenancy                               | N/A    | no tenant data                                                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                     |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                          |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                            |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                    |

## Deploy modes

| Mode       | Behaviour                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                               |
| On-prem    | identical: the same build, no SaaS-only code path                                              |
| Air-gapped | identical: parsing and placement checks read local files and the package makes no network call |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./node` and the asset paths `./schema/*.json` — Validates: FR-001
- **P-002**: `.` exports `baseUrlOf`, `devPorts`, `updateFeed`, `parseRunway`, `checkPlacement`, `runwayJsonSchema`, the enums `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine` and `CacheEviction`, the errors `RunwayInvalidError` and `RunwayUnresolvedError`, and the document, facts and issue types — Validates: FR-002
- **P-003**: `./node` exports `definesFor`, `devServer` and `readRunway` — Validates: FR-003
- **P-004**: a member schema fixes `version` at 3, has no `member` key and refuses every root key, while the root schema holds the topology groups — Validates: FR-004
- **P-005**: `requires.<resource>.engine` accepts `postgres` and `valkey` only, and `dedicated: true` without a `reason` is refused — Validates: FR-005
- **P-006**: the `.` entry has no static Node import and reaches the file system through `process.getBuiltinModule` only under Node — Validates: FR-006
- **P-007**: the TLS paths of the dev facts never reach a bundle, and no secret value is read anywhere — Validates: FR-007

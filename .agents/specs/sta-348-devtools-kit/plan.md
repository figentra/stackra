# Plan: `@stackra/devtools-kit`

**Spec**: `.agents/specs/sta-348-devtools-kit/spec.md`

1. **Member files**: `package.json` (entry `.`, workspace versions only), `tsconfig.json` (decorators preset, for
   `@stackra/validation`'s source reached through `@stackra/events`), `turbo.jsonc` (`tier:lib`), `stackra.config.ts`,
   authored tool configs until gen writes them (STA-339), README, AGENTS, LICENSE, ORIGIN.
2. **Kit** (`src/core/services/devtools-kit.service.ts`): a `Service` taking `EventBus` and `Clock`. Maps for tabs and
   RPC functions (latest definition wins; removers compare identity), a bounded buffer for the stream, and a tap
   listener (a class expression, so gen never registers it) subscribed to `Event` on the bus.
3. **Host session**: one host at a time; the session filters sensitive tabs, reads and calls asynchronously, replays
   the buffer and fails with `detached` after `detach()`. Host callbacks run isolated.
4. **Errors, constants, types**: one declaration per file in `src/core/{errors,constants,types}/`.
5. **Tests** beside each public symbol; **changeset** `.changeset/devtools-kit-package.md`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                               |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/devtools-kit`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/events` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                              |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                       |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                     |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                             |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                   |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                          |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                  |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                    |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                 |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                            |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` — Validates: FR-001
- **P-002**: `.` exports `DevtoolsKit`, `DevtoolsError`, `DEVTOOLS_BUS_CHANNEL` and the ten `Devtools*` types named in the spec (`DevtoolsAttachment` to `DevtoolsTabMetadata`) — Validates: FR-002
- **P-003**: `DevtoolsKit` extends `Service` and takes `EventBus` and `Clock` by constructor type, so gen wires it and another package's devtools service takes it by type — Validates: FR-003
- **P-004**: no file under `src/` imports `node:*`, a UI package or a transport — Validates: FR-004
- **P-005**: `DevtoolsKit` is the "Devtools tab and RPC registry" of the registry row behind entry `.`, and `package.json` depends on `@stackra/events` as the row says — Validates: FR-005

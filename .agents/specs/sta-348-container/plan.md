# Plan: `@stackra/container` wave 1b

**Spec**: `.agents/specs/sta-348-container/spec.md`

## Design

- Kind registry: `KIND_RECORDS` (a WeakMap, internal) written by `registerKind`, read by `kindOf`, which walks the
  constructor chain. `createKind` returns a function usable as `extends K` and `extends K(options)`; `Module` is built
  with it. `Service` and `Explorer` are bare abstract classes registered with `registerKind`. `Driver(Port)` returns a
  fresh subclass of the port, registered with its port.
- `createDecorator({ kind, target, kinds })`: the decorator is its own key; it records into WeakMaps and refuses a
  wrong target or kind. `Lifetime` (facet plus codes via `Enum.of`) and `Replaces` are made with it.
- `Container`: merges wirings (later wins), loads drivers (override, test choice, `selectedBy`, only candidate),
  builds singletons eagerly, runs Explorers, `forRequest()`, `close()`. `Clock` defaults to an internal
  `SystemClockDriver`; `DiscoveryService` is built by the container.
- `./react`: `ContainerProvider` and `useContainer` over a context.
- `./testing`: `TestingModuleBuilder` (`override`, `useDrivers`, `onCompile`, `compile`), `TestingApp`,
  `registerWiring` and `registerTestingPlugin`, the extension point other packages use by declaration merging.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                    |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/container`; workspace imports: `@stackra/contracts` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                     |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                   |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                            |
| Tenancy                               | N/A    | no tenant data                                                                                                                          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                  |
| Not built yet (ADR 0227)              | PASS   | no `@nestjs/*`, no `reflect-metadata`, no runtime auto-wiring; wiring is written at build time by gen                                   |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                               |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                       |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                         |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                      |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                 |

- Boundaries: runtime imports `@stackra/contracts` only; React is an optional peer; `./react` and `./testing` import
  `.` through `#core/*`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; no `define*` outside config; no `Guard`, `Provider` (except the React context component), `scope`.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `Container`, `DiscoveryService`, `Driver`, `Explorer`, `Lifetime`, `Module`, `Service`, `UnresolvedPortError`, `createDecorator`, `named`, `createKind`, `registerKind`, `kindOf` and `Replaces`, with the types `DriverName`, `Named`, `Wiring`, `WithPartner` and `DriverRegistry` — Validates: FR-002
- **P-003**: `./react` exports `ContainerProvider`, and `./testing` exports `createTestingModule`, `TestingApp`, `registerWiring` and `registerTestingPlugin` — Validates: FR-003
- **P-004**: no entry exports `Injectable`, `Inject`, `defineToken` or `Provider`, and `package.json` has no `reflect-metadata` dependency — Validates: FR-004
- **P-005**: `new UnresolvedPortError(...)` is an `Error` and its prototype chain holds no other class, because it extends `Error` only — Validates: FR-005
- **P-006**: `.` exports `createKind` and no export is named `defineKind` — Validates: FR-006
- **P-007**: `package.json` `dependencies` lists `@stackra/contracts` and nothing else — Validates: FR-007

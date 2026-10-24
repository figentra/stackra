# Plan: `@stackra/scope` wave 5

**Spec**: `.agents/specs/sta-348-scope/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  three ports and the types), `.` from `src/core/` with `src/config/`, `./node` from `src/node/` (the module groups
  `models/`, `services/`, `drivers/`, `access/`, `database/migrations/`), `./react` from `src/react/`.
- `ScopeConfig extends Config({ schema: ScopeOptions })`, with `ScopeConfig$` registered beside it as `SeoConfig$` is.
- The path is the tree: no parent column; ancestors are prefixes and descendants the paths below. The level is text.
- Each resolver step is a driver of `ScopeResolver`; the chain is one too, takes the three steps by class and asks them
  through a protected `steps()` that a host override extends.
- `ScopeNodeService extends CrudService<ScopeNode>` adds nodes and holds the two parameterised raw `ltree` reads;
  `PostgresScopeTreeDriver` maps its rows to entries. `MemoryScopeTreeDriver` serves tests and clients.
- `ActiveScopeService` is a small subscribable store; `useScope` reads it through `useSyncExternalStore`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/scope`; imports only `tier:lib` packages; no app, service or `encore.dev`                  |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                         |
| Security                              | PASS   | the header is validated and dropped outside a grant; a missing answer refuses closed; no detail tells a caller other scopes |
| HTTP and events                       | PASS   | no endpoint or event; the one header is `X-Scope-Path`, per the tenancy rule                                                |
| Tenancy                               | PASS   | forced row-level security on the node table; no application filter; no tenant vocabulary (R-59)                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; `ltree` is an approved extension (ADR 0160)                                             |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0327 stands, the open items are listed in the spec                            |

- Boundaries: runtime imports of config, container, contracts, database, entitlements, errors, model and validation;
  dev-only `@stackra/testing`, the tooling presets and the React test libraries.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, the service `ScopeNodeService`, refusals end in `Error`, no `define` prefix.

## Properties

- **P-001**: `package.json` names `@stackra/scope` at `packages/security/scope` and `exports` lists only `.`, `./contracts`, `./node` and `./react` — Validates: FR-001
- **P-002**: `buildConfig(ScopeConfig)` equals `ScopeConfig$.parse({})`, whose levels are `platform` then `product`, and a repeated level key refuses — Validates: FR-002
- **P-003**: each port is an abstract class extending `Port`, a driver of it is an instance of it, and no entry exports `ScopeRef` — Validates: FR-003
- **P-004**: for every request, the chain's answer is the first defined answer of header, claim and root, and a header outside every grant never answers — Validates: FR-004
- **P-005**: for every declared level list and parent level, `add` accepts a level exactly when `childLevelsOf` lists it, and the migration compiles with forced row-level security on `app.scope_paths` — Validates: FR-005
- **P-006**: `ScopeDepthEntitlement` is a limit entitlement and no call is registered as gated by it — Validates: FR-006
- **P-007**: `useScope()` renders the service's current scope after every `set`, and `null` in a server render — Validates: FR-007
- **P-008**: `grep -ri tenant packages/security/scope` finds nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | the same build; the IAM package binds `GrantedScopes`                        |
| On-prem    | identical: the same build, no SaaS-only code path                            |
| Air-gapped | identical: needs no network; the tree lives in the deployment's own Postgres |

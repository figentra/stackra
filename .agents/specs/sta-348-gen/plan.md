# Plan: `@stackra/gen` wave 2

**Spec**: `.agents/specs/sta-348-gen/spec.md`

## Design

- **`.` (core, isomorphic, pure)**: the IR types (`MemberIR`, `DeclaredClass`, `ShapeIR`, `FieldIR`, `TypeDesc`, ...),
  the identity helpers (`actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, `portKey`, `configKeyOf`,
  `folderKey`, `toolName`, `driverName`, `deriveEndpoint`), `buildManifest` (identity checks included),
  `checkIdentityLock`, `compareManifests`, `emitSchemas`, `jsonSchemaOf`, `emitWiring`, `emitMemberModule`,
  `emitPackageEntries`, `emitRuntimeEntries`, `openApiOf`, `rootModuleOf` and `generateMember`, which returns every file
  or, on any error, none.
- **`./node`**: the host seam (`TsHost` over `openTsgoHost` and `openTs6Host`, chosen by `openHost`),
  `createSourceReader` (kinds from the `extends` clause, options as constants, partners from type arguments,
  constructor tokens, facets made by `createDecorator`, `handle`, refusals, statics, traits, shapes from the declared
  type node then the checker, enums in source order, file exports), `readMemberFacts`, `readDependencyManifests`,
  `discoverMember`, `generate` (write or `--check`), and the class-component compiler (`classComponentsPlugin`,
  `compileClassComponents`, `classComponents()` for Vite).
- **`./metro-transformer`**: `transform` (the pass with `retainLines`, then Expo's or React Native's transformer) and
  `getCacheKey`.
- **`./testing`**: `loadManifest`, `loadOpenApi`, `previousRelease` (git tags), `expectBackwardCompatible`,
  `projectOpenApi`, `discoverWithGen`.
- **Wave 9 catch-up (STA-490)**: `.` adds `emitEntities`, `emitRegistrations`, `emitBoot`, `emitWebhooks`,
  `emitPrefixes`, `emitRoutes`, `emitBlocks`, `emitToolConfigs`, the identity helpers `integrationKey`, `webhookPath`,
  `sequenceKey`, `blockKey`, `routeKey`, the prefix registry `PUBLIC_ID_PREFIXES`, and `EntityIR`/`RelationIR`;
  `generateMember` runs every emitter, so `generate` and `stackra gen` write them. `./node` reads each model's entity
  facts and the member's dependency names (`MemberIR.packages`), and knows the `Sequence` kind base. A registration
  call is written only for a function its package exports and only when it has a row.
- The platform set in the wiring is derived (every constructor token from a `@stackra/*` package), never listed.
- A kind base is recognised by name only when declared in a `@stackra/*` package; a dependency's declaration file is
  read only for a kind (`X_base: ConfigClass<...>`), an inherited field or a constant.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/gen`; workspace imports: `@stackra/contracts`, `@stackra/errors`, `@stackra/money` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                   |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                 |
| HTTP and events                       | N/A    | gen is the compiler: it declares no action, endpoint or event; it writes the adapters the HTTP rules require                                                          |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                        |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the `typescript6` pin in `catalog:tooling` is added by the owner (T012)                                                            |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                       |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                               |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/errors`, `@stackra/money`, `@babel/core`, `typescript`
  (7) and `typescript6` only; no app, service or `encore.dev`. `@stackra/container`, `@stackra/config` and
  `@stackra/validation` are test-only conformance dependencies (the generated code imports them; gen does not).
- Versions: catalogs and `workspace:*` only; `typescript6` needs its catalog entry (owner).
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; refusal codes snake_case.
- Secrets: none; a config's schema never reaches a wire file.
- Shortcut recorded: `readMemberFacts` reads the static `define*` call by pattern until a tool section needs the syntax
  tree (STA-339).

## Deploy modes

| Mode       | Behaviour                                                                           |
| ---------- | ----------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                    |
| On-prem    | identical: the same build, no SaaS-only code path                                   |
| Air-gapped | identical: gen reads local source and committed manifests and makes no network call |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./node`, `./testing` and `./metro-transformer`, and every version in it is `catalog:` or `workspace:*` — Validates: FR-001
- **P-002**: discovery reads only the member's own source in path order through one host seam, and takes a dependency's kinds and identities from its committed manifest, never from its `.d.ts` — Validates: FR-002
- **P-003**: the manifest, `openapi.json`, the lock and the backward-compatibility comparison derive their identities by ADR 0294 decisions 20 to 22 and ADR 0305 rules 1, 28, 34 and 36, so one source gives one byte-identical output — Validates: FR-003
- **P-004**: the shape compiler, wiring, member module and entries follow registry section 5 items 1 to 6 and gap G1, and one source and manifest give the same wiring and entries on every run — Validates: FR-004
- **P-005**: `classComponents()` from `./node` applies the class-component pass of ADR 0305 rules 37 to 41 and no other transform — Validates: FR-005
- **P-006**: `./testing` exports exactly the symbols the template imports from `@stackra/gen/testing` — Validates: FR-006
- **P-007**: every model's entity file lists exactly its trait and initialized fields as `[OptionalProps]` and one property per field, relation and getter, and an unreadable relation is refused, never dropped — Validates: FR-007
- **P-008**: each registration row names a class by the identity the manifest locked, a call with no row is not written, and every called function is one its package exports — Validates: FR-008
- **P-009**: a per-model token or platform service is bound once per member with its constructor tokens, whatever number of classes inject it — Validates: FR-009
- **P-010**: integration, sequence, block and route keys change only with `@Renamed`, and no public id prefix has two owners in a member, its hosted packages and the shared registry — Validates: FR-010
- **P-011**: an app's runtime entry loads exactly the route and block files this run writes, and a package's or service's tool configs name exactly its generated entries — Validates: FR-011

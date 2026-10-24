# Plan: `@stackra/contracts` wave 1a

**Spec**: `.agents/specs/sta-348-contracts/spec.md`

## Design

- One entry, `.`, from `src/core/` through the stand-in barrel `src/core/index.ts` (STA-339 replaces it). No
  `src/contracts/` folder: it would become a `./contracts` entry.
- Groups: `bases/` (`Port`, `Enum`), `enums/`, `ports/`, `types/`, `constants/` (`Duration`), `functions/` (`brand`,
  the four `define*`). One declaration per file.
- `Enum` is an abstract class with static `of`, `values`, `meta` and a merged type-only namespace (`Enum.Value`,
  `Enum.Of`, …). Case data lives in a module `WeakMap` keyed by the frozen enum object; the type carries it under a
  type-only `~enum` key, so a case is a plain code.
- `Port` is an abstract class with a `declare`d `~kind: "port"` brand and nothing else (no constructor state).
- `Duration` is a branded `P${string}` ISO 8601 string in canonical form (days, then `T` hours, minutes, seconds with
  a millisecond fraction; zero is `PT0S`), built and read by a frozen namespace object.
- `Actor` is a union on `kind`: a user has `realm` and a `usr` id; every other kind has no realm, so a realm check
  narrows the id.
- `PublicId`, `Email` and `Url` are template-literal types, so literal defaults read naturally; `Branded` records its
  base so `brand<B>()` takes exactly it.
- `define*` are typed identity functions; gen reads the argument from the syntax tree.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/contracts`; no workspace runtime import (dev edges only to `@stackra/testing` and the tooling presets); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                        |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                      |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                               |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                     |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                          |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                            |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                    |

- Boundaries: no workspace runtime import; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases `PascalCase(kind)`; `define` only for the four member helpers (0305 rule 3).

## Properties

- **P-001**: For every enum, `Enum.values(X)` equals the codes of `Object.values(X)` in source order — Validates: FR-003
- **P-002**: For every non-negative finite `n`, `Duration.parse(Duration.seconds(n)) === Duration.seconds(n)` and `Duration.toMilliseconds(Duration.seconds(n)) === Math.round(n * 1000)` — Validates: FR-005
- **P-003**: `package.json` names `@stackra/contracts` at `packages/foundation/contracts`, `exports` lists only `.`, and `dependencies` holds no workspace package — Validates: FR-001
- **P-004**: `.` exports every symbol the template imports from `@stackra/contracts` (`Actor`, `ActorKind`, `ApiArea`, `Branded`, `Clock`, `DataClassification`, `Duration`, `Email`, `HttpMethod`, `IdentityResolver`, `Json`, `Logger`, `PublicId`, `Realm`, `SortDirection`, `StackraManifest`, `Target`, `Tone`, `Url`, `brand`, `Port`, `Enum`, the four `define*` and `MigrationRunner`) — Validates: FR-002
- **P-005**: `Clock`, `Logger` and `IdentityResolver` are abstract classes that extend `Port`, carry its type-only `~kind` brand, and work as constructor tokens — Validates: FR-004
- **P-006**: `Enum.values(Tone)` is `default`, `accent`, `success`, `warning`, `danger`, and no second `Tone` is exported — Validates: FR-006
- **P-007**: `PublicId<"ord">` refuses an id of another prefix at compile time, and `Branded` refuses a plain base value and a value of another brand — Validates: FR-007
- **P-008**: the loyalty-kit template manifest cast with `json as StackraManifest` typechecks, the way generated code reads a manifest — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

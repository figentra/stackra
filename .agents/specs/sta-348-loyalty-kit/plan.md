# Plan: `@stackra/loyalty-kit` wave 6

**Spec**: `.agents/specs/sta-348-loyalty-kit/spec.md`

## Design

- Six entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (ports, enums,
  types), `.` from `src/config/` and `src/core/` (isomorphic: the configuration, the service, the memory ledger, the
  refusals, the shared views, the constants and functions), `./node` from `src/node/` (the module and its groups),
  `./react` and `./native` from their component folders, `./testing` from `src/testing/` plus the factories and the
  seeder, which live in `src/node/database/` so Faker never reaches a runtime entry.
- The Postgres driver wraps `Journal<LedgerEntry>`: `append` with `floor: null`, `debit` with `floor: 0`, `expire` as
  one `reverseWhere` with `floor: 0`. The model's `@Journaled({ account: "memberId", amount: "points", floor: 0 })`
  maps the fields and makes 0 the default floor of any other call.
- The memory driver keeps a Map keyed `<member>|<reference>` and makes every check and write of `debit` and `expire` in
  one synchronous turn, cutting each expiry against the running balance oldest first, as the journal does.
- `LoyaltyService` and `AccountService` keep the sample's logic; dependencies are explicit fields assigned in the
  constructor (no parameter properties: services typecheck under `erasableSyntaxOnly`).
- Each schema, event and the settings group registers its zod schema in its own file until gen writes
  `#stackra/schemas`; the config ships `LOYALTY_KIT_CONFIG_SCHEMA` as `LoyaltyKitConfig$`.

## Constitution Check

| Law                                   | Result | Note                                                                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/commerce/loyalty-kit`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                              |
| Security                              | PASS   | covered debits serialise per member; a customer acts only for themselves; no SQL is written here                 |
| HTTP and events                       | PASS   | endpoints keep the sample's paths; integration events are versioned with a change file; the job has no endpoint  |
| Tenancy                               | PASS   | both tables take tenancy's trait and macro (forced equality policy); no `tenant` identifier is declared          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests           |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology                                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                        |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the port's differences from the sample are listed in the README        |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, events, i18n, ledger, model,
  search, settings, tenancy, ui, validation and versioning; dev-only `@stackra/testing`, the testing library and the
  tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, refusals end in `Error`, schemas in `schemas/` one per file, the extension point
  `LoyaltyKitExtensionPoint`, the change `PointsEarnedV1Change`; no `define` prefix.

## Properties

- **P-001**: `package.json` names `@stackra/loyalty-kit` at `packages/commerce/loyalty-kit` and `exports` lists `.`, `./contracts`, `./node`, `./react`, `./native`, `./testing` and the assets — Validates: FR-001
- **P-002**: the `./contracts` barrel exports exactly the two ports and the three enums, and the types keep their shapes — Validates: FR-002
- **P-003**: for any balance, request and total, a quote never exceeds the balance, the request or `maxRedeemPercent` of the total, and any interleaving of hold, settle and release returns held points exactly once — Validates: FR-003
- **P-004**: for any sequence of appends, debits and expiries on either driver, each (member, reference) pair is written at most once and no debit or expiry leaves a balance below zero — Validates: FR-004
- **P-005**: an earn credits `floor(amountMinor × earnPerMinor)` scaled by the tier, at most once per reference, and records one `points.earned` — Validates: FR-005
- **P-006**: each action, query, event, extension, listener and settings class records the sample's options — Validates: FR-006
- **P-007**: the compiled migrations state and comment every column, carry the equality policy and the unique indexes, and build the account index concurrently — Validates: FR-007
- **P-008**: both balance renderers warn exactly when the next expiry is less than thirty days away — Validates: FR-008
- **P-009**: the fake answers from its ids and records each call; the matcher passes exactly on the ledger's balance — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                             |
| ---------- | --------------------------------------------------------------------- |
| SaaS       | the same build; the tables live in each host's `loyalty_kit` schema   |
| On-prem    | identical: the same build, no SaaS-only code path                     |
| Air-gapped | identical: needs no network; Postgres holds the entries and the locks |

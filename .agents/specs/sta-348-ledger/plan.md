# Plan: `@stackra/ledger` wave 5

**Spec**: `.agents/specs/sta-348-ledger/spec.md`

## Design

- One entry, `.`, from `src/core/` through a stand-in barrel (STA-339 replaces it). Node runtime, as database's `.` is.
- `Journal<M>` is an abstract generic service over `Locks`; its model comes from the subclass `journalOf(Model)` makes
  (one per model, cached, named `<Model>Journal`). Reads and writes go through `repositoryOf(model)`: `sum` for the
  balance, `findOne` and `find` for lookups, `count` for posting duplicates, `insert` (a savepoint each) for writes, a
  `UniqueViolation` re-checked with `find` so only the pair's own index counts as a duplicate.
- Field names come from `@Journaled` (a class facet made with `createDecorator`, models only) merged over the journal's
  own names; the model must carry `AppendOnly` (`traitsOf`).
- A write that lowers a balance runs inside `Locks.with` on `ledger.journal:<Model>:<account>` keys (sorted, five-second
  wait), which on Postgres is a transaction-level advisory lock joined to the caller's transaction. Inside it: duplicate
  check, balance read, floor check, insert. Credits skip the lock.
- `reverseWhere` reads the matching entries ordered by time and reference, drops reversals and already-reversed ones,
  and writes one reversal each, cut at the floor against a running balance.
- `post` validates amounts, balance and distinct pairs before locking, then checks duplicates and per-account floors and
  writes the lines in order.

## Constitution Check

| Law                                   | Result | Note                                                                                                        |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/commerce/ledger`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                         |
| Security                              | PASS   | no SQL; values reach Postgres as ORM parameters; lock keys are hashed and never returned                    |
| HTTP and events                       | N/A    | no endpoint or event; the one refusal is `failed_precondition`                                              |
| Tenancy                               | PASS   | no table and no tenant words; isolation is the consumer's entry table and its row-level security            |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests      |
| Not built yet (ADR 0227)              | PASS   | Postgres through MikroORM via @stackra/database only; no external ledger service                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0220 stands, the gaps are listed in the spec                  |

- Boundaries: runtime imports of container, contracts, database, errors, locking and model; dev-only
  `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: the refusal ends in `Error`, the facet is `Journaled`, the token factory `journalOf` (as `repositoryOf`), no
  `define` prefix; `Journal` keeps the template's platform name (as `Locks` and `GraphQuery` do).

## Properties

- **P-001**: `package.json` names `@stackra/ledger` at `packages/commerce/ledger` and `exports` lists only `.` — Validates: FR-001
- **P-002**: the entry's `index.test.ts` lists exactly `Journal`, `Journaled`, `journalOf` and `UnbalancedPostingError`, and the loyalty kit's call shapes fit the journal's signatures — Validates: FR-002
- **P-003**: for every sequence of appends, each (account, reference) pair is written at most once and a repeat reports `written: false` — Validates: FR-003
- **P-004**: for every interleaving of debits on one account, the balance never ends below the floor that applied, and a retried debit reports a duplicate — Validates: FR-004
- **P-005**: for every set of entries and floor, a reversal pass writes at most one reversal per entry, none for a reversal, and leaves the balance at or above the floor — Validates: FR-005
- **P-006**: for every posting, either every line is written or none, and lines that do not sum to zero refuse `unbalanced_posting` — Validates: FR-006
- **P-007**: `Journaled.on(Model)` returns the frozen options and `journalOf(Model)` returns the same token on every call — Validates: FR-007
- **P-008**: a model without `AppendOnly` and a fractional amount are refused, and no identifier under `packages/commerce/ledger/src` contains `tenant` (only doc examples use tenancy's `BelongsToTenant`) — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| SaaS       | the same build; entries live in each consumer's own Postgres schema           |
| On-prem    | identical: the same build, no SaaS-only code path                             |
| Air-gapped | identical: needs no network; Postgres holds the entries and the locks locally |

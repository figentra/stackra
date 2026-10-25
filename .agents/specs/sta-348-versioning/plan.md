# Plan: `@stackra/versioning` wave 4

**Spec**: `.agents/specs/sta-348-versioning/spec.md`

## Design

- One entry, `.`, from `src/core/` through the stand-in barrel `src/core/index.ts` (STA-339 replaces it).
- Groups: `bases/` (`Change` with its instance bases), `constants/` (`VERSIONING_HEADERS`, the internal registry),
  `errors/` (the two refusals), `functions/` (`registerChanges`, `downgrade`, `upgrade`, `resolveVersion` and the
  internal `isCalendarDate` and `eventChangeOf`), `types/`. One declaration per file, the kind base file aside (the
  kind and its instance bases, as `@stackra/actions` does).
- `Change` dispatches on the type of `from` to one of two `createKind("change", ...)` bases: `ChangeBase<S>` (extends
  `Schema`, abstract `down`) for dated changes and `EventChangeBase<S>` (adds abstract `up`) for event changes. Both
  record exactly `from` and `sunset`. Two overloads type the forms: `<S extends Event>` with a whole `from`, `<S extends
Schema>` with a string `from`; each defaults the subject to `never` so `WithPartner` prints a hint when it is left
  out. `Change.prototype` is `ChangeBase.prototype`, so `instanceof Change` holds.
- The registry is a `Map` from subject class to its changes, oldest `from` first, written by `registerChanges` (gen
  emits it) and read by `downgrade`, `upgrade` and `resolveVersion`.
- `downgrade` finds the one change that serves a version: the change from a whole version, or the dated change with the
  earliest `from` after the pin, and calls its `down` on a bare prototype. `upgrade` builds the old payload with the
  change's `create` (its schema checks it) and calls `up`.
- `resolveVersion` takes header, pin, fallback; `Deprecation` is `@<unix seconds>` of the successor date, `Sunset` the
  HTTP date of the earliest sunset among dated changes after the version.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                               |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/communication/versioning`; imports only lower `@stackra/*` packages through their entries; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                |
| Security                              | PASS   | an old payload is checked by its version's schema before `up`; a refusal never echoes the caller's header                                          |
| HTTP and events                       | PASS   | paths stay unversioned and requests are never transformed (ADR 0118); event names keep `.v<n>` (ADR 0141)                                          |
| Tenancy                               | N/A    | no tenant data                                                                                                                                     |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                             |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                   |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                          |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                  |
| Deploy modes (ADR 0076)               | PASS   | a library with no I/O, identical in SaaS, on-prem and air-gapped                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                 |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand, two notes are open items                                                           |

- Boundaries: runtime edges to container, contracts, errors, events and validation; dev-only `@stackra/testing`, zod
  and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: the kind base is `Change`, with no `define` prefix (0305 rule 3); refusals end in `Error`.

## Properties

- **P-001**: `package.json` names `@stackra/versioning` at `packages/communication/versioning`, `exports` lists only `.`, and every runtime dependency is `workspace:*` — Validates: FR-001
- **P-002**: `.` exports `Change`, and `X.create(fields)` of a change in either form returns an instance of `X`, of `Change` and of `Schema` — Validates: FR-002
- **P-003**: For every declared change, `kindOf(X)` is `{ kind: "change", options: { from, sunset } }` with exactly those keys, and every `from` that is not a whole version from 1 or a calendar day throws — Validates: FR-003
- **P-004**: After `registerChanges(pairs)`, each subject's changes are sorted by `from`, and registering a pair again leaves them unchanged — Validates: FR-004
- **P-005**: For every version `v`, `downgrade(S, x, v)` calls at most one `down`, leaves `x` unchanged, and returns `x` itself when no change serves `v` — Validates: FR-005
- **P-006**: For every old version `v` with a change, `upgrade(E, p, v)` equals `change.up(change.create(p))`, and a payload that breaks the version's schema throws — Validates: FR-006
- **P-007**: `resolveVersion` returns the header if sent, else the pin, else the fallback; its headers are empty exactly when the version is the newest supported date; and `now` at or after the version's sunset throws `VersionSunsetError` — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                      |
| ---------- | -------------------------------------------------------------- |
| SaaS       | a library, bundled into the consumer's service and its gateway |
| On-prem    | identical: the same build, no SaaS-only code path              |
| Air-gapped | identical: needs no network at build or run                    |

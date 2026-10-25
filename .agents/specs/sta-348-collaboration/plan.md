# Plan: `@stackra/collaboration` wave 4

**Spec**: `.agents/specs/sta-348-collaboration/spec.md`

## Design

- Ports (`src/contracts/ports/`): `PresenceChannel.join(room, handlers)` returns a `PresenceLink` (`move`, `leave`)
  and reports `onOpen`, `onPeers` (the full list of the other peers, principal stamped by the server) and `onClose`;
  `SyncTransport.open(room, handlers)` returns a `SyncLink` (`send`, `close`) and reports `onOpen`, `onUpdate` and
  `onClose`; `SnapshotStore` has `save(room, snapshot)` and `latest(room)`. Drivers reconnect by themselves and never
  call back before the open call returns. `DocumentReplica` (`apply`, `encode`, `onUpdate` for local changes only) is
  the CRDT seam, so `.` never imports Yjs.
- `CollaborationRoom` is `{ document: PublicId; scope?: ScopeRef }`; rooms are keyed by the document.
- `CollaborationOptions` (shape) registers `COLLABORATION_CONFIG_SCHEMA` (`cursorIntervalMilliseconds` 16 to 1,000,
  default 50; `snapshotIntervalSeconds` 1 to 3,600, default 30); `CollaborationConfig` is
  `Config({ schema: CollaborationOptions })`; the barrel exports the schema as `CollaborationConfig$`.
- `LiveCollaborationEntitlement` (`src/core/access/`) is `Entitlement({ kind: EntitlementKind.Feature })`, key
  `collaboration.live_collaboration` derived by gen.
- `CollaborationSession` (`extends Service`, over the config, both transport ports and `EntitlementSource`): `join`
  and `bind` add a hold and return an idempotent release; the first hold reads the grant for `room.scope?.id`, then
  joins presence, or records the refusal (`EntitlementRequiredError`, or a `TypeError` for a count) in the room state.
  `state(room)` and `subscribe` feed `useSyncExternalStore`; status reuses realtime's `RealtimeStatus`. `moveCursor`
  sends the first move at once and the latest one per interval. `bind` opens the sync stream only for a granted room,
  sends `replica.encode()` on every open, applies remote updates and streams local ones.
- `SnapshotService` (`extends Service`, over the config and `SnapshotStore`): `restore`, `save`, and `track`, which
  schedules one save per interval from the first local change and saves pending changes on stop; a failed tracked save
  is logged.
- `./react`: `yjsReplica(doc)` applies remote updates under a private origin so they never echo; `usePresence` holds
  the room in an effect keyed by the document and throws a recorded error during render; `useCursors` filters the
  peers with a cursor and returns a stable mover; `useSharedDocument` makes one `Y.Doc` per document (guid = the id),
  binds it, restores it and starts autosave only after a successful restore.
- `./testing`: memory drivers of the three ports; the presence and sync drivers share their rooms through `peer()` and
  emulate a network with `drop()` and `reconnect()`; the sync relay keeps the updates so a late stream catches up.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/collaboration`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/entitlements`, `@stackra/errors`, `@stackra/realtime`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                                                          |
| Security                              | PASS   | live collaboration only after a `true` grant for the room's scope; peers' principals come from the server driver, never the client; refusals carry no details                                                                                                                |
| HTTP and events                       | N/A    | no action, endpoint or integration event                                                                                                                                                                                                                                     |
| Tenancy                               | PASS   | no tenant vocabulary (R-59): rooms are scoped by `ScopeRef`; the store driver isolates snapshots by that scope                                                                                                                                                               |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                                                       |
| Not built yet (ADR 0227)              | PASS   | Yjs is the CRDT for shared documents only; no sync engine, offline queue or record sync                                                                                                                                                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; `yjs` awaits its catalog pin                                                                                                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; the right is granted by the plan or the licence                                                                                                                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand; the realtime room channel is an open item                                                                                                                                                                    |

- Boundaries: imports the seven workspace packages above, `zod`, React and Yjs only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; one declaration per file.
- Secrets and PII: principal ids and cursors in memory only; document content stored by the host's store driver.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                                                |
| ---------- | ---------------------------------------------------------------------------------------- |
| SaaS       | a build-time library; the grant comes from the plan service's `EntitlementSource` driver |
| On-prem    | identical: the same build; the grant comes from the verified licence                     |
| Air-gapped | identical: needs no network at build; the grant comes from the signed licence file       |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing`, and `src/contracts/` imports no other entry and no Yjs — Validates: FR-001
- **P-002**: `.` exports exactly `CollaborationConfig`, `CollaborationConfig$`, `CollaborationOptions`, `CollaborationSession`, `LiveCollaborationEntitlement` and `SnapshotService`, and no file under `src/core/` imports `yjs` — Validates: FR-002
- **P-003**: `./contracts` exports exactly the three ports, `./react` exactly the three hooks and `yjsReplica`, and `./testing` exactly the three memory drivers — Validates: FR-003
- **P-004**: for any grant other than `true`, the room's state is `disconnected` with an error and no presence link or sync stream is opened; a released room never joins after its grant arrives — Validates: FR-004
- **P-005**: for any order of opens, drops and local changes, two bound replicas hold the same state once both streams are open, and no applied remote update is reported as local — Validates: FR-005
- **P-006**: tracking saves at most once per `snapshotIntervalSeconds`, only after a local change, once more on stop when changes are pending, and never before a successful restore — Validates: FR-006

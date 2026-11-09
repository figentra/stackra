# Feature Specification: the identity lock as a table, with permissions, roles, config, schemas, endpoints and reports, and the event version bump

**Feature Branch**: `figentra/sta-2057-identity-lock-table`

**Created**: 2026-11-03

**Status**: Planned

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2057

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-04 of the gen coverage audit, gaps G-42 and G-74. G-42: the identity
lock (`checkIdentityLock`, its `LOCKED` list) covers only class-level identities; it skips permissions, roles, config,
schemas, endpoints and reports, so an added `<x>Id` input silently moves an endpoint and a report rename cannot be
`@Renamed` (ADR 0294 decision 22). G-74: the sanctioned version bump of an integration event fails the identity lock
and `compareManifests` reads it as a removed event. Turn the `LOCKED` list into a table that later packages add rows
to."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`checkIdentityLock`, `compareManifests`, a refusal golden);
  packages/foundation/validation (`IDENTITY_KINDS` gains `report`, so `@Renamed` may mark a report class)
- **Public contract change**: additive: `stackra gen --check` refuses `identity_changed` for six more identities
  (permissions, roles, config keys, schema names, endpoints, report keys); a sanctioned event version bump stops
  failing the lock and stops reading as a removal; `@Renamed` accepts a report class. The manifest's shape is unchanged.
- **Cross-service events**: none (an integration event's version bump is judged, no event is added)
- **Tenancy and data**: none
- **Security and privacy**: none (a locked permission key protects stored role grants from a silent rename; no new
  data)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0294 decisions 20 and 22, ADR 0132's note and ADR 0305 rule 5 as written)
- **New dependencies**: none
- **Deploy modes**: same in all three (build-time check)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md (the locked identities row); packages/developer/gen/\_\_golden\_\_/README.md
  (the new fixture row); packages/foundation/validation/AGENTS.md if it lists the kinds
- **Lane**: full
- **Change risk**: R1 (a build-time check gets stricter; a member whose committed manifest disagrees now fails
  `gen --check` until it adds `@Renamed` or restores the identity)

## Glossary _(full lane)_

- **Lock**: the comparison of the manifest this run derives with the committed `stackra.manifest.json`.
- **Subject**: what the lock pairs an old and a new entry by: the declaring class, a Permissions class and its static,
  or a schema's class name.
- **Lock row**: one entry of the lock table: which entries of the manifest it reads, the subject and identity of each,
  and any change it accepts without `@Renamed`.
- **Version bump**: an integration event whose written name stays and whose `version` grows, with a `Change` class
  that downgrades the new version to the old one (ADR 0305 rule 5).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Every derived identity is locked (Priority: P1)

A developer moves a module folder, renames a report key or adds an `orderId` field to an action's input. Gen tells
them that a locked identity changed, names the old and new identity and the `@Renamed` that accepts it.

**Why this priority**: an unlocked permission key strands stored role grants, a moved endpoint breaks every client,
and a report key is a wire key; ADR 0294 decision 22 says every identity is locked.

**Independent Test**: unit tests of `checkIdentityLock` with two hand-built manifests per row, and the
`refusal-identity-changed` golden over the `service` fixture.

**Acceptance Scenarios**:

1. **Given** a committed manifest that locks `shop.order.read` for `OrderPermissions.read`, **When** the module folder
   is renamed so the key becomes `sales.order.read`, **Then** gen refuses `identity_changed` for `OrderPermissions`.
2. **Given** the same change, **When** `OrderPermissions` carries `@Renamed("shop.order")` or
   `@Renamed("shop.order.read")`, **Then** the lock passes.
3. **Given** a locked endpoint `POST /orders/cancel`, **When** an `orderId` input moves it to
   `PUT /orders/:orderId/cancel`, **Then** gen refuses `identity_changed`; `@Renamed("POST /orders/cancel")` accepts it.
4. **Given** a locked report key `orders.order_sales`, **When** its written key becomes `revenue`, **Then** gen refuses
   `identity_changed`; `@Renamed("order_sales")` on the report class accepts it and loads at runtime.

---

### User Story 2 - A sanctioned event version bump passes (Priority: P1)

A developer bumps `OrderPaid` from version 1 to 2 and adds `ChangeOrderPaid`. Gen's lock and the backward-compatibility
test accept it.

**Why this priority**: ADR 0305 rule 5 makes the bump the sanctioned way to break an event; today it fails both
checks, so nobody can take it.

**Independent Test**: unit tests of `checkIdentityLock` and `compareManifests` with an event at `.v1` and `.v2`.

**Acceptance Scenarios**:

1. **Given** a locked `orders.order.paid.v1`, **When** `OrderPaid` declares `version: 2`, **Then**
   `checkIdentityLock` reports nothing and `compareManifests` reports no removed event.
2. **Given** a locked `orders.order.paid.v2`, **When** `OrderPaid` goes back to version 1, **Then** the lock refuses
   `identity_changed`.

---

### Edge Cases

- **EC-01**: an action whose key changed is judged by its key alone; its derived endpoint follows the key, so one `@Renamed(old key)` accepts both and one refusal names the class.
- **EC-02**: a model whose key changed is not judged again by its schema name; each class is refused or accepted once.
- **EC-03**: a schema name that two modules declare (`ReplicaPage`, the generated report and search shapes), and an enum (it cannot carry `@Renamed`), is not locked by name.
- **EC-04**: generated entries (`file` under `.stackra/`, the report and search queries) are not locked; the report or model they come from is.
- **EC-05**: a package's `config` entries carry `from` as their import specifier, not a hosted origin; they are still the member's own and are locked.
- **EC-06**: a removed class, a removed static and a class renamed with its derived identity stay removals: the lock reports nothing and `compareManifests` reports the removal, as the lock's contract says today.
- **EC-07**: an action that gains or loses its endpoint (`endpoint: false`) is an addition or a removal, not a move.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE lock SHALL read its sections from one table of rows, each naming how it reads entries, their subject and identity, and any change it accepts; adding a locked identity SHALL be one row.
- **FR-002**: WHEN a permission entry's key differs from the locked key of the same Permissions class and static THE lock SHALL refuse `identity_changed`, unless the class's `@Renamed` names the locked key or its set prefix (`<module>.<resource>`).
- **FR-003**: WHEN a role, report or config entry's key differs from the locked key of the same class THE lock SHALL refuse `identity_changed`, unless the class's `@Renamed` names the locked key in full or as written.
- **FR-004**: WHEN an own schema name's `<module>.<Name>` differs from the locked one THE lock SHALL refuse `identity_changed`, unless the class's `@Renamed` names the locked one.
- **FR-005**: WHEN an action's key is unchanged and its endpoint `<METHOD> <path>` differs from the locked one THE lock SHALL refuse `identity_changed`, unless the class's `@Renamed` names the locked route or its path.
- **FR-006**: WHEN an integration event keeps its written name and its version grows THE lock SHALL accept it.
- **FR-007**: WHEN a previous event is missing from `next` and `next` holds the same written name at a higher version THE `compareManifests` function SHALL NOT report it removed, SHALL skip its field comparison, and SHALL still apply the change sunset rule against the bumped entry.
- **FR-008**: THE class form of `@Renamed` SHALL accept a report class.
- **FR-009**: THE lock SHALL judge each class once: a class an earlier row found changed (refused or accepted) is skipped by later rows.

### Key Entities

- **Lock row**: section read, subject of each entry, identity of each entry, accepted changes, rename match.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: IF a permission, role, report key or endpoint path changes without a matching `@Renamed` THEN THE lock SHALL refuse `identity_changed` naming the class, the old and the new identity.
- **AC-002**: WHEN an integration event's version is bumped with its Change class THE lock SHALL pass and `compareManifests` SHALL report no removed event.
- **AC-003**: THE refusal golden `__golden__/refusal-identity-changed` SHALL pass.
- **AC-004**: WHEN a config key or a schema name changes without a matching `@Renamed` THE lock SHALL refuse `identity_changed`.
- **AC-005**: WHEN a report class carries `@Renamed(old)` THE class SHALL load without a TypeError.

## Success Criteria _(mandatory)_

- **SC-001**: every identity row of ADR 0294 decision 20 that the manifest records (actions, events, permissions, errors, models, roles, config, schemas, endpoints, reports, blocks, routes) is locked — verified by: unit
- **SC-002**: the `service` golden and every other golden pass unchanged — verified by: unit (golden runner)

## Out of scope

- Requiring the `Change` class on a bump, and refusing a break without a bump: G-75, wp-106 (STA-340).
- Recording a Change's `from` and `sunset` in the event entry: G-73, wp-65.
- Sections the manifest does not record yet (flags, settings, notifications, widgets, seeders, listeners,
  workflows, skills): G-41; each adds a row to this table in its own package.
- A field-level `@Renamed` on a Permissions static; a static rename stays a removal.
- New removal reports in `compareManifests` for roles, reports or config.

## Assumptions

- The lock pairs by class, as it does today for models and refusals, whose identity also derives from the class name:
  a class rename that changes a derived identity is a removal plus an addition, which the backward-compatibility test
  reports (the lock's file contract, "A class that disappeared is not a changed identity"). What the lock adds is the
  part of a derived identity that changes while the class stays: the module folder, the member key, the written key,
  the endpoint.
- The endpoint's identity is the ADR 0294 decision 20 form, `PUT /orders/:orderId/cancel`; `@Renamed` names it in that
  form or as the bare path.
- The bump needs no evidence in the manifest today: the `changes` writer is G-73 (wp-65) and the Change check is G-75
  (wp-106); the lock judges the name and the version.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent · created from the gen coverage audit (G-42, G-74)
- 2026-11-03 · Draft → Clarified · agent · answered from the code and ADR 0294, 0132, 0305; no owner question
- 2026-11-03 · Clarified → Planned · agent · plan.md written

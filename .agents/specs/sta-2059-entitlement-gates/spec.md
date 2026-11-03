# Feature Specification: gen gates calls by the entitlement option, quota meters, hosted entitlements and limits

**Feature Branch**: `figentra/sta-2059-entitlement-gates`

**Created**: 2026-11-03

**Status**: Clarified

**Tier**: feature

**Approver**: leader

**Linear**: STA-2059

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-19 of the gen coverage path, gaps H-6, H-7, H-8 and H-53: add the
`entitlement` option to `ActionOptions` and `QueryOptions`, make gen gate a quota's metered actions, resolve an
entitlement or a counted model that a hosted package declares, and refuse an `entitlement` option that names no
entitlement."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none (no committed member names an `entitlement` option, declares a quota or a metered action
  today, so every committed manifest regenerates unchanged)
- **Packages touched**: packages/application/actions (the `entitlement` option type); packages/developer/gen (the
  manifest's entitlement gates, two refusal codes)
- **Public contract change**: additive: `ActionOptions` and `QueryOptions` gain `entitlement`; a manifest action entry
  gains `entitlements` (the keys it names) and `meter` (the meter name) when declared; a quota's manifest entry gains
  `meter` and `per`; gen gains the refusal codes `entitlement_unknown` and `entitlement_counts_unknown`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none beyond closing a fail-open: a call that names a plan right is now gated by it, where
  today it runs ungated
- **Secrets**: none
- **ADR needed**: no (implements ADR 0215 decision 1, ADR 0216 decision 3 and ADR 0294 decisions 16 and 20 as written,
  and the gen README's entitlements rule)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md (entitlements bullet: meters, hosted entitlements and models, the
  two codes); packages/application/actions/README.md (the `entitlement` option)
- **Lane**: full
- **Change risk**: R2 (a committed contract every host reads gains fields, and a build that names an unknown
  entitlement now fails)

## Glossary _(full lane)_

- **Gate**: an action or query key listed in an entitlement's manifest `gates`; gen's `registerEntitlements` row turns
  it into the class `PlanEntitlementCheckDriver` checks.
- **Hosted package**: a dependency whose committed manifest a service merges into its own (`MERGED_SECTIONS`), each
  merged entry carrying `from`.
- **Metered action**: an action whose `meter: { name, kind, field? }` option feeds a meter through `usage.recorded`.
- **Quota**: an `Entitlement({ kind: EntitlementKind.Quota, meter, per })`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The `entitlement` option is typed and gates the call (Priority: P1)

A module author writes `entitlement: ExportsEntitlement` (or a list) on an `Action` or `Query`. It type-checks, a class
that is not an entitlement does not, and gen lists the call's key in the entitlement's `gates`.

**Why this priority**: H-7. Today the option gen reads is not in the options types, so no author writes it and every
committed manifest has `gates: []`.

**Independent Test**: a type test in the actions package; a build-manifest test with a local entitlement named by an
action and a query.

**Acceptance Scenarios**:

1. **Given** `class ExportOrdersAction extends Action({ key: "order.export", actors, entitlement: ExportsEntitlement })`,
   **When** the package type-checks, **Then** it compiles, and `entitlement: OrderService` does not.
2. **Given** that action and the local `ExportsEntitlement`, **When** gen runs, **Then** the manifest's
   `orders.exports` entry has `gates: ["orders.order.export@1"]` and the action entry has
   `entitlements: ["orders.exports"]`.

---

### User Story 2 - A quota gates the actions that feed its meter (Priority: P1)

A quota names the meter it reads. Gen lists every action whose `meter.name` is that meter in the quota's `gates`, so
the plan driver's quota branch runs.

**Why this priority**: H-6 (high). Gen never reads a meter, so a quota gates nothing and `quota_exceeded` never fires.

**Independent Test**: a build-manifest test with a quota on `ai.tokens` and two actions, one metered on it and one not.

**Acceptance Scenarios**:

1. **Given** `TokenQuotaEntitlement` (`meter: "ai.tokens"`, `per: month`) and an action with
   `meter: { name: "ai.tokens", kind: "sum", field: "tokens" }`, **When** gen runs, **Then** the quota entry has
   `meter: "ai.tokens"`, `per: "month"` and that action's key in `gates`, and the unmetered action is not gated.

---

### User Story 3 - A host's call or limit reaches a hosted package's entitlement or model (Priority: P1)

A service hosts a package that declares an entitlement and a model. A host action naming the package's entitlement is
gated by it, a host limit counting the package's model records the model's key and gates its create action, and a
name that resolves to nothing is refused.

**Why this priority**: H-8 and H-53. Today the gate is silently dropped and the limit records a bare class name.

**Independent Test**: a build-manifest test with a service IR whose dependency manifest lists an entitlement, a model
and that model's create action.

**Acceptance Scenarios**:

1. **Given** a host action with `entitlement: LiveCollaborationEntitlement` imported from a hosted package, **When**
   gen runs, **Then** the merged `collaboration.live_collaboration` entry in the host's manifest gates the host action.
2. **Given** a host limit with `counts: () => CustomField` imported from a hosted package, **When** gen runs, **Then**
   its entry has `counts: "content.custom_field"` and gates the hosted `content.custom_field.create@1`.
3. **Given** an `entitlement` option naming a class that is no entitlement of the member or of a dependency, **When**
   gen runs, **Then** gen refuses `entitlement_unknown`, naming the action.
4. **Given** a limit whose `counts` names a class that is no model of the member or of a dependency, **When** gen runs,
   **Then** gen refuses `entitlement_counts_unknown`, naming the entitlement.

---

### Edge Cases

- **EC-01**: A quota whose meter no action of the member or its hosted packages feeds keeps `gates: []`; it is not
  refused, since another member's actions may feed the meter.
- **EC-02**: A package action naming a dependency's entitlement records the key on its own action entry; the package's
  manifest cannot gate an entitlement it does not hold, so the host that merges both computes the gate.
- **EC-03**: A merged entitlement keeps the gates its own package computed, plus the host's; the list is sorted and
  holds each key once.
- **EC-04**: A limit gates actions only (`kind: "action"`), never a query whose key happens to share the prefix.
- **EC-05**: Members with no `entitlement` option, quota or metered action (every committed member today) produce a
  byte-identical manifest.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `ActionOptions` and `QueryOptions` types SHALL accept `entitlement`, one entitlement class or a list
  of them, typed so that a class whose instances lack the entitlement kind brand does not compile.
- **FR-002**: WHEN an action or query names entitlements in its `entitlement` option THE gen manifest SHALL record their
  keys on the action entry (`entitlements`) and list the call's key in each named entitlement's `gates`.
- **FR-003**: WHEN an action declares `meter` THE gen manifest SHALL record the meter name on its entry (`meter`), and
  WHEN a quota declares `meter` and `per` THE gen manifest SHALL record both on the quota's entry and gate every action
  whose entry carries that meter.
- **FR-004**: WHEN an `entitlement` option names a class that a hosted dependency's manifest lists as an entitlement
  THE gen manifest SHALL resolve it to that entry's key, and THE host's merged copy of that entry SHALL gate the call.
- **FR-005**: WHEN a limit's `counts` names a model that a dependency's manifest lists THE gen manifest SHALL record that
  model's key as `counts` and gate that model's create actions among the member's and its hosted packages' actions.
- **FR-006**: IF an `entitlement` option names a class that is no entitlement of the member or of a dependency THEN THE gen manifest build
  SHALL refuse `entitlement_unknown`.
- **FR-007**: IF a limit's `counts` names a class that is no model of the member or of a dependency THEN THE gen manifest build SHALL
  refuse `entitlement_counts_unknown`.

### Key Entities _(include if feature involves data)_

- **Manifest entitlement entry**: `key`, `class`, `module`, `file`, `kind`, `counts?`, `where?`, `meter?`, `per?`,
  `gates`, and `from` on a host's merged copy.
- **Manifest action entry**: gains `entitlements?` (keys it names) and `meter?` (meter name).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN an action declares `entitlement: X` with X an entitlement class THE TypeScript compiler SHALL accept
  it, and SHALL refuse a class that is not an entitlement.
- **AC-002**: WHEN an action or query names a local entitlement THE manifest entitlement entry SHALL have that call's
  key in non-empty `gates`.
- **AC-003**: WHEN a quota names a meter THE manifest SHALL gate every action that feeds that meter and no other.
- **AC-004**: WHEN a host action names a hosted package's entitlement THE host's manifest SHALL gate it on the merged
  entry.
- **AC-005**: WHEN a host limit counts a hosted package's model THE manifest SHALL record the model key and gate its
  create action.
- **AC-006**: IF an `entitlement` option or a limit's `counts` names an unknown class THEN THE gen manifest build SHALL refuse it with
  `entitlement_unknown` or `entitlement_counts_unknown`.

## Success Criteria _(mandatory)_

- **SC-001**: The four acceptance scenarios of the work package hold in `build-manifest.function.test.ts` — verified by:
  unit
- **SC-002**: Every committed `stackra.manifest.json` regenerates unchanged (`stackra gen --check` on the box) —
  verified by: unit (gen check in CI)
- **SC-003**: `pnpm verify` is green for the touched members on ci-box — verified by: manual (box log)

## Out of scope

- Entitlement refusals on an action's `refusals` list (H-24, wp-64) and entitlement data on generated client
  descriptors (H-23, wp-53); this spec only records the keys they will read.
- Settings and Integration listing entitlement keys (H-54, wp-154).
- A module-kind entitlement keyed by its bare module key (the runtime accepts `billing`; gen still derives
  `<module>.<name>`); no committed member declares one.
- Runtime changes to `PlanEntitlementCheckDriver` or `registerEntitlements`: both already read `gates`.

## Assumptions

- A class imported from a package carries its import specifier as `from` (the driver-port lookup in
  `build-manifest.function.ts` relies on the same), so a hosted entitlement or model is matched by class name and by a
  dependency whose package name is that specifier or its prefix.
- `@stackra/actions` cannot import `@stackra/entitlements` (the latter depends on the former), so the option is typed
  structurally against the entitlement instance brand `"~kind": "entitlement"`.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent (wp-19) · created from the gen coverage audit (H-6, H-7, H-8, H-53)
- 2026-11-03 · Draft → Clarified · agent (wp-19) · no open question: every answer comes from the code, ADR 0215, ADR
  0216 and the gen README

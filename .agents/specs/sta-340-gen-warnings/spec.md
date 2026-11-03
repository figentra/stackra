# Feature Specification: gen warnings, and ADR 0101's action-first checks

**Feature Branch**: `figentra/sta-340-gen-warnings`

**Created**: 2026-11-03

**Status**: Planned

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-340

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-05 of the gen coverage audit, gap G-131: gen has no warning severity
and none of ADR 0101's checks (`gen/core/types/gen-error.type.ts`). Add a severity to `GenError`, print a warning in
`formatGenError`, and let `stackra gen` and `stackra gen --check` print warnings and exit 0 while an error still exits

1. Add ADR 0101's checks in `gen/core/functions/check-action-first.function.ts`: warn when an action calls another
   module's client or an outbound driver without a workflow, and fail a workflow reachable from an adapter without an
   action."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`GenError`, `formatGenError`, `generateMember`, `generate`,
  `GenerateResult`, `DeclaredClass`, the source reader, the new `checkActionFirst`); packages/developer/cli (`runGen`)
- **Public contract change**: additive: `GenError.severity?: "warning"`, `GenerateResult.warnings`,
  `generateMember(...).warnings`, `DeclaredClass.workflows?`, the export `checkActionFirst`, and two gen codes
  (`action_without_workflow`, a warning; `workflow_without_action`, an error)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (a build-time check; it reads source, calls nothing)
- **Secrets**: none
- **ADR needed**: no (implements the Enforcement of ADR 0101 and its 0294 note as written; the note's "planned —
  STA-340" line becomes the two codes)
- **New dependencies**: none
- **Deploy modes**: same in all three (build-time check)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (CLI output only)
- **Docs to update**: ADR 0101 Enforcement and its 0294 note (planned → the two gen codes); gen's AGENTS.md (a
  warning never blocks writing)
- **Lane**: full
- **Change risk**: R2 (an additive public contract of @stackra/gen; no member that passes today fails, except one
  whose controller, command or listener starts a workflow, and none does in this repository)

## Glossary _(full lane)_

- **Warning**: a `GenError` with `severity: "warning"`. It prints like an error with the word `warning`, carries a
  fix, and never stops gen writing or makes the CLI exit non-zero.
- **Error** (refusal): a `GenError` with no `severity`. As today: when there is one, nothing is written and the CLI
  exits 1.
- **Cross-boundary dependency**: a constructor token of an action that reaches past its own module: a class from
  `#stackra/clients/<service>` (another service's generated client), a `service` class of a sibling module of the same
  member, or `ConnectionStore` from `@stackra/integrations` (the managed client to an external provider, ADR 0308).
- **Starts a workflow**: the class body passes a class whose name ends in `Workflow` as the first argument of a
  `.run(` call (`ctx.run(RefundWorkflow, input)`, ADR 0101 as amended by 0294).
- **Adapter class**: a member class of kind `controller` (a raw endpoint), `command` (a CLI command) or `listener`
  (an event reaction).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A warning prints and gen still succeeds (Priority: P1)

A developer runs `stackra gen` (or `stackra gen --check`) on a member with a warning. Gen prints the warning with its
location, code and fix, writes (or checks) everything as usual, and exits 0. An error still exits 1.

**Why this priority**: ADR 0101 asks gen to warn, and gen today knows only refusals that block writing; every
later warning check (wp-50, wp-75, wp-95, wp-155) builds on this.

**Independent Test**: `formatGenError` on a warning; `runGen` with a warning-only result resolves true.

**Acceptance Scenarios**:

1. **Given** a `GenError` with `severity: "warning"`, **When** it is formatted, **Then** the first line reads
   `<file>:<line>:<col> warning <code> <subject>: <message>` and the second `  fix: <fix>`.
2. **Given** a member whose only finding is a warning, **When** `stackra gen` runs, **Then** the warning prints, the
   files are written and the run exits 0.
3. **Given** the same member and an up-to-date tree, **When** `stackra gen --check` runs, **Then** the warning prints
   and the run exits 0.
4. **Given** a member with an error and a warning, **When** `stackra gen` runs, **Then** both print, nothing but the
   client files and manifest is written, and the run exits 1.

---

### User Story 2 - An action that crosses a boundary without a workflow is warned (Priority: P1)

A developer writes an action whose constructor takes another service's client (or a sibling module's service, or the
integrations `ConnectionStore`) and never calls `ctx.run(SomeWorkflow, ...)`. Gen warns
`action_without_workflow`, naming the dependency and the fix.

**Why this priority**: ADR 0101 decision 3 makes a workflow mandatory for such work; its Enforcement asks gen to warn.

**Independent Test**: `checkActionFirst` over a hand-built IR.

**Acceptance Scenarios**:

1. **Given** an action with a `#stackra/clients/billing` dependency and no workflow, **When** gen checks it,
   **Then** it warns `action_without_workflow`.
2. **Given** the same action that calls `ctx.run(ChargeWorkflow, input)`, **When** gen checks it, **Then** nothing.
3. **Given** a query with the same dependency, **When** gen checks it, **Then** nothing (reads follow ADR 0104).

---

### User Story 3 - A workflow reachable from an adapter is refused (Priority: P1)

A developer writes a controller, command or listener that takes a workflow class or the `WorkflowRunner` port, or
starts a workflow in its body. Gen refuses `workflow_without_action`.

**Why this priority**: ADR 0101 decision 1: workflows are never exposed directly to an adapter; an action, or the
workflow's `startOn` for an event, is the only way in.

**Independent Test**: `checkActionFirst` over a hand-built IR.

**Acceptance Scenarios**:

1. **Given** a listener whose constructor takes `WorkflowRunner`, **When** gen checks it, **Then** it refuses
   `workflow_without_action`.
2. **Given** a controller whose body calls `this.runner.run(RefundWorkflow, ...)`, **When** gen checks it, **Then**
   it refuses `workflow_without_action`.
3. **Given** the golden service, **When** gen runs, **Then** neither code appears.

---

### Edge Cases

- **EC-01**: an action's sibling-module dependency of a kind other than `service` (a config, a port) is not a
  cross-boundary dependency.
- **EC-02**: a class from a dependency package is described by its manifest and is not checked here (only the
  member's own classes are).
- **EC-03**: `.run(` with a first argument that is not a class ending in `Workflow` (`app.handlers.run(async ...)`)
  does not start a workflow.
- **EC-04**: the manifests and clients passes never report warnings; only the full pass runs `checkActionFirst`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `GenError` type SHALL carry an optional `severity` whose one value is `"warning"`; a `GenError` without it SHALL be an error.
- **FR-002**: WHEN `formatGenError` formats a warning THE function SHALL print `warning` where it prints `error` for an error, and the same fix line.
- **FR-003**: WHEN the full pass finds only warnings THE `generateMember` and `generate` functions SHALL write and return the files as for a clean run, and return the warnings in `warnings`.
- **FR-004**: WHEN `runGen` receives warnings THE function SHALL print each with `formatGenError` and SHALL resolve as if there were none, so `stackra gen` and `stackra gen --check` exit 0; an error SHALL still resolve false (exit 1).
- **FR-005**: WHEN an action of the member takes a cross-boundary dependency and its body starts no workflow THE `checkActionFirst` function SHALL warn `action_without_workflow` on that action.
- **FR-006**: WHEN a controller, command or listener of the member takes a workflow class or `WorkflowRunner`, or its body starts a workflow, THE `checkActionFirst` function SHALL refuse `workflow_without_action`.
- **FR-007**: THE source reader SHALL record on each class the workflow classes its body starts (`DeclaredClass.workflows`).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a warning is formatted THE `formatGenError` function SHALL print `<at> warning <code> <subject>: <message>` and `  fix: <fix>`.
- **AC-002**: WHEN a member's only finding is a warning THE `runGen` function SHALL print it and resolve true, with and without `check`.
- **AC-003**: WHEN a member has an error THE `runGen` function SHALL resolve false.
- **AC-004**: WHEN an action takes a `#stackra/clients/*` client, a sibling module's service or `ConnectionStore` and starts no workflow THE `checkActionFirst` function SHALL return one `action_without_workflow` warning for it.
- **AC-005**: WHEN that action starts a workflow, or is a query THE `checkActionFirst` function SHALL return nothing for it.
- **AC-006**: WHEN a controller, command or listener takes `WorkflowRunner` or a workflow class, or starts a workflow THE `checkActionFirst` function SHALL return one `workflow_without_action` error for it.
- **AC-007**: WHEN gen runs on the golden service THE run SHALL report neither code (the golden test stays green).

## Success Criteria _(mandatory)_

- **SC-001**: the gen and cli unit tests and the goldens pass with the new tests — verified by: unit

## Out of scope

- The other STA-340 checks (call shapes, endpoints, names, the decorator registry): their own packages.
- Warning for a one-step workflow that meets none of ADR 0101's criteria (a reviewer's call, not a static fact).
- `agent` classes: an agent reaches behaviour through tools, which are actions (ADR 0360); not an adapter here.
- Other outbound ports (webhook sending goes through the outbox); `ConnectionStore` is the one managed outbound path.

## Assumptions

- Another service's client is a constructor token whose specifier starts with `CLIENTS_SPECIFIER`
  (`#stackra/clients/`), which the reader already resolves before the client file exists.
- A workflow class's name ends in `Workflow` (ADR 0294 class names: stem plus kind suffix), so the body scan needs no
  type resolution.
- `WorkflowRunner` (`@stackra/actions/contracts`) is the port behind `ctx.run`; a class other than the pipeline that
  takes it starts workflows itself.
- `moduleOf` gives every class under `src/` outside `src/modules/<key>/` the member key, so a member without feature
  modules has no sibling-module dependency.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent · created from the gen coverage audit (G-131), wp-05
- 2026-11-03 · Draft → Clarified · agent · answered from the code and ADR 0101 (with its 0294 note); no owner question
- 2026-11-03 · Clarified → Planned · agent · plan.md written

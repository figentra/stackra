# Feature Specification: rules and workflow remainder (publisher access, money floors, studio editors)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-773

**Clarifications status**: complete

**Input**: Pause an automation when its publisher loses access, grants never above the publisher's; a declared outcome-kind form gen collects; money floors with currency and save-time refusal; the automation editor in @stackra/builder and outcome editing in RuleBuilder; a ./testing helper for document runs; the seed principal and dry-run policy; signal retention; version-pin naming.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/rules, packages/runtime/workflow, packages/experience/builder, packages/developer/gen
- **Cross-service events**: `AutomationPaused` (domain)
- **Tenancy and data**: `workflow.automations` gains `publisher`, `paused_at`, `pause_reason` under its existing scope policy
- **Secrets**: none
- **ADR needed**: yes: 0423, 0425, 0426, 0427 (Proposed)
- **New dependencies**: @stackra/rules and @stackra/workflow in @stackra/builder (workspace)
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `PublisherAccess` port, `MemoryPublisherAccessDriver`; `AutomationService.publish(id, n, principal, publisher)` refuses `automation_exceeds_publisher`; `triggered` and `recheck` pause on lost access (`AutomationPaused`); migration `workflow.0004`.
- **FR-002** `RuleOutcome({ key, label, params })` kind base; gen's `outcomes` manifest section and `RuleOutcome` kind base, locked by class.
- **FR-003** Money floors (`{ minor, currency }`), `crossedFloor`, `floorProblems`, `checkOutcomes(input, floors)`, `RuleSetService.draft(..., floors)`.
- **FR-004** `RuleBuilder` outcome editing (`OutcomesEditor`), floors marked before save.
- **FR-005** `DocumentEditor`, `useDocumentEditor`, `automationProblems` in @stackra/builder.
- **FR-006** `runDocument` in `@stackra/workflow/testing`.
- **FR-007** `workflow.signalRetention` (default `7d`).
- **FR-008** ADR 0423 decisions 3 and 4 (seed principal, seed dry-run policy) and ADR 0427 decision 3 (version-pin names), Proposed.

## Not built here

- The @stackra/iam `PublisherAccess` driver (iam's folder); the seed-pack release check of ADR 0423 decisions 3 and 4 (@stackra/cli).
- The console's automation studio surface over `DocumentEditor` (apps).
- Tests, typecheck and build are written but not run (owner mode).

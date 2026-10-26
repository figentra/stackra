# Feature Specification: onboarding checklist engine and industry template profiles

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-776

**Clarifications status**: complete

**Input**: Checklists as `workflow-template:<product>:onboarding` documents with locked steps; progress per tenant and per user; completion events; industry templates as seed-pack profiles applied at sign-up.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/runtime/workflow, packages/developer/gen (public-id prefixes)
- **Cross-service events**: `ChecklistStepCompleted`, `ChecklistCompleted` (domain)
- **Tenancy and data**: two tables under forced row-level security on `scope_path`
- **Secrets**: none
- **ADR needed**: yes: 0424 (Proposed)
- **New dependencies**: none
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `ChecklistTemplate$`, `ChecklistCustomization$`, `IndustryProfile$`, `ChecklistAudience`.
- **FR-002** `checklistView`, `checkCustomization` (`step_locked`, `step_unknown`, `step_duplicate`), `ChecklistInvalidError`.
- **FR-003** `Checklist`, `ChecklistProgress`, migration `workflow.0006`, `ChecklistService` (seed, applyProfile, customize, complete, view).
- **FR-004** `ChecklistStepCompleted`, `ChecklistCompleted` domain events.

## Not built here

- The console checklist component (G6, @stackra/ui).
- Each product's seeded onboarding checklist and industry profiles (product seed packs).
- The actions that complete a step (each product's module).
- Tests, typecheck and build are written but not run (owner mode).

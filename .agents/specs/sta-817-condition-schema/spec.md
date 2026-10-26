# Feature Specification: schema for untrusted condition trees and a cross-service field registry

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-817

**Clarifications status**: complete

**Input**: A zod schema to validate an untrusted condition tree, and a field registry checked at write time across services.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/rules
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes: 0425 decision 4 (Proposed)
- **New dependencies**: none
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `Condition$`: shape only, the same walk (`conditionProblems`) as `Rules.problems`.
- **FR-002** `Rules.conditionSchema()`: the registry checked inside the input schema, issues by node path.
- **FR-003** `FactSource$`: a service publishes its fields so another builds the registry.

## Not built here

- Access adopting `Condition$` and a published `FactSource$` (OS services/access).
- Tests, typecheck and build are written but not run (owner mode).

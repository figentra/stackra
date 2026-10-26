# Feature Specification: payroll category and the PayrollConnector contract (integrations part)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-714

**Clarifications status**: complete

**Input**: R1 wave C: `payroll` category, `PayrollConnector.pushPayInputs` (hours, sessions, tips, commissions). Integrations part only.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/communication/integrations
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0422 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `IntegrationCategory.Payroll`.
- **FR-002** `PayrollConnector` (`pushPayInputs`, `findPayInputs`), `PayInput`, `PayInputBatch`, `PayInputReceipt`, `PayInputKind`.
- **FR-003** `assertPayInputs` checks a batch; `MemoryPayrollConnector` in `./testing`.

## Not built here

- ZenHR, Kombo and Gusto connectors (later issue).
- The CSV, XLSX and DATEV export driver in @stackra/data-transfer.
- The provider list per pack (`providers.payroll`): pack data.
- Tests, typecheck and build are written but not run (owner mode).

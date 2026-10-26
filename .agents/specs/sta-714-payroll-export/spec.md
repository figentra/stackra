# Feature Specification: payroll pay-input export (data-transfer part)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-714 (export part only)

**Clarifications status**: complete (RV-50, R3-SO-05; ADR 0431 decision 4)

**Input**: A payroll export driver in `@stackra/data-transfer` (CSV, XLSX, DATEV ASCII) with per-provider mapping
profiles as seed data.

## Impact

- **Packages touched**: packages/data/data-transfer
- **Tenancy and data**: pay inputs are personal data, streamed to the writer, never logged
- **ADR needed**: yes, 0431 (Proposed), decision 4
- **Lane**: full · **Change risk**: R2

## Requirements

- **FR-001** `PayInput` (employee, pay item, period, quantity, amount, currency).
- **FR-002** `PAYROLL_EXPORT_PROFILE_SCHEMA` / `PayrollExportProfile`: provider, format, columns, codes, decimal
  separator, date format, delimiter, DATEV section.
- **FR-003** `payrollSheet(profile, inputs)`: an unmapped pay item is refused; numbers stay numbers for XLSX.
- **FR-004** `DatevAsciiWriterDriver` with `datevWriteOptionsOf(profile, tenantEntries)`: `[Allgemein]`,
  `[Satzbeschreibung]`, `[Bewegungsdaten]`, ISO 8859-1, CRLF.
- **FR-005** Seed profiles in `assets/data/payroll-export-profiles/`: `generic-csv`, `datev-lodas`, `zenhr-xlsx`.

## Not built here

- The `payroll` integrations category, `PayrollConnector` and the ZenHR, Kombo and Gusto connectors
  (`@stackra/integrations`); the provider list per market pack.
- Tests, typecheck and build are written but not run (owner mode).

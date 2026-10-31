# Plan: applyChange records break-glass

**Spec**: `.agents/specs/sta-1692-settings-apply-change-break-glass/spec.md`

## Design

- `applyChange` meta widens to include `breakGlass`; a blank reason on break-glass throws before any write; the flag is
  recorded on the revision. Docblocks updated. No other behaviour changes.

## Constitution Check

| Law                       | Result | Note                           |
| ------------------------- | ------ | ------------------------------ |
| Boundaries (ADR 0003)     | PASS   | one package, no new import     |
| Tenancy                   | PASS   | no tenant data change          |
| Secrets                   | PASS   | none                           |
| Not built yet (ADR 0227)  | PASS   | nothing introduced             |
| Test placement (ADR 0022) | PASS   | `src/core/services/__tests__/` |
| Versions and catalogs     | PASS   | no dependency change           |

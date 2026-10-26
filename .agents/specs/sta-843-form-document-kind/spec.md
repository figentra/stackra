# Feature Specification: form document kind

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-843

**Clarifications status**: complete

**Input**: @stackra/builder exports a form document kind so onboarding answers are a form document seeded per product.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/experience/builder
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes: 0426 (Proposed)
- **New dependencies**: @stackra/rules, @stackra/workflow (workspace)
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `FormFieldType`, `FormDocument$`, `FormDocument`, `FormStep`, `FormField`.
- **FR-002** `checkForm`, `formProblems`, `FormInvalidError`; conditions are `@stackra/rules` conditions over earlier answers.
- **FR-003** `visibleFields`, `formAnswersSchema(form, now, { partial })`.
- **FR-004** `DocumentEditor` and `useDocumentEditor` edit a form.

## Not built here

- The renderer, `forms.submit@1` and the submission model (experience service).
- Each product's onboarding form document (product seeds).
- Tests, typecheck and build are written but not run (owner mode).

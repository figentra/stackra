# Feature Specification: exported return type for the called form of Policy

**Feature Branch**: `figentra/sta-1680-policy-called-form-dts`

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1680

**Clarifications status**: complete

**Input**: "`Policy<M>({ permissions })` returns a class whose base `PolicyBase` is not exported, so a consumer's
`export class XPolicy extends Policy<X>({ ... }) {}` fails declaration emit with TS4094." Lead-approved bug fix.

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/iam`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (declaration-emit fix, no behaviour change)
- **New dependencies**: none
- **Deploy modes**: all, unchanged
- **Lane**: lite
- **Change risk**: R1 (types only, keys unchanged)
- **Licence tier**: free
- **Docs to update**: the iam README if it shows the called form

## Status history

- 2026-10-30 → Clarified: lead-approved bug fix requested by the leader

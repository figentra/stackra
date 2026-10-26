# Feature Specification: achievements remainder (verify query, short code, unique grants, certificates)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-717

**Clarifications status**: complete (ADR 0432, Proposed)

## Impact

- **Packages touched**: packages/application/achievements
- **Tenancy and data**: the unscoped verification index gains a code hash; no personal data
- **ADR needed**: yes, 0432 (Proposed)
- **New dependencies**: `@stackra/documents` (`workspace:*`); lockfile not updated (owner mode)
- **Lane**: full · **Change risk**: R2

## Requirements

- **FR-001** `VerifyAwardQuery` (`award.verify`, public area, anonymous, not a tool) with `VerifyAwardInput` (token or
  code) and `VerifyAwardOutput` (`valid` with the award, or `not_found`).
- **FR-002** A 12-character Crockford code per new award (`newAwardCode`), `normalizeAwardCode`, the code hash in the
  index, `AwardService.verifyCode`, `CertificateFields.verifyCode`.
- **FR-003** Migration 0002: `verify_code`, `code_hash` (unique), and the partial unique index of live awards per kind,
  recipient and period; a lost race is `period_taken`.
- **FR-004** `AwardService.renderCertificate` through `renderDocument` of `@stackra/documents`.

## Not built here

- The `awk`, `awd`, `awv` rows of gen's `PUBLIC_ID_PREFIXES` (packages/developer/gen, outside this wave's folders).
- Wallet passes (ACA-186). Tests, typecheck and build are written but not run (owner mode).

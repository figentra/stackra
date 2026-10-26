# Feature Specification: notifier driver for any target service, category, channel data and market

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-836

**Clarifications status**: complete

**Input**: OS gate-A gap (notifications SPEC gap 1): `NotificationsNotifierDriver` hard-codes `messages.message.send@1` and a mail-only input.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/communication/notifications
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0422 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `NotifierTarget` (action ref and payload mapper) and `NotifierMessage` (template, category, principal, market, data, channels).
- **FR-002** `MESSAGES_NOTIFIER_TARGET`, the default, keeps the current input.
- **FR-003** The driver takes an optional target and `MarketContext`; a `null` payload skips a principal.

## Not built here

- Per-recipient language: still the default locale (identity gap).
- Rendering channels other than mail: the notification kind declares mail only today.
- Tests, typecheck and build are written but not run (owner mode).

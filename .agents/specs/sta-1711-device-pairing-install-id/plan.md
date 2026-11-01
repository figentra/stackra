# Plan: pairing status check sends the opening install's id

**Spec**: `.agents/specs/sta-1711-device-pairing-install-id/spec.md`

## Design

- `check` builds `DEVICE_HUB_PATHS.pairing(id)` plus a `URLSearchParams` query holding `await this.identity.id()`.

## Constitution Check

| Law                       | Result | Note                           |
| ------------------------- | ------ | ------------------------------ |
| Boundaries (ADR 0003)     | PASS   | one package, no new import     |
| Tenancy                   | PASS   | no tenant data                 |
| Secrets                   | PASS   | the install id is not a secret |
| Not built yet (ADR 0227)  | PASS   | no new dependency              |
| Test placement (ADR 0022) | PASS   | `src/core/drivers/__tests__/`  |
| Versions and catalogs     | PASS   | no catalog change              |

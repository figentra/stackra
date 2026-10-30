# Feature Specification: refuse a revoked device's calls in the action pipeline

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1684

**Clarifications status**: complete

**Input**: Leader 2026-10-30, defence in depth: a revoked device's offline replays are refused today only because identity revokes its credential (401). The pipeline should refuse them itself.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/actions
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R2 (a new refusal in the action pipeline; unbound, nothing changes)

## Behaviour

1. A `DeviceStatusReader` port (`isRevoked(deviceId)`) in @stackra/actions contracts, and `MemoryDeviceStatusReaderDriver` in core.
2. A call that carries a DeviceOrder (`request.device`) whose device the bound reader says is revoked is refused with `DeviceRevokedError` (forbidden, not retryable) before the device-order step, so its sequence is never settled and nothing runs; the audit records the refusal.
3. With no reader bound the step does not run, so packages without devices are unaffected (the no-op default). OS devices provides the real driver.

## Status history

- 2026-10-30: Draft → Clarified

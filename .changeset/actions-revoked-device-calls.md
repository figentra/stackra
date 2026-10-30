---
"@stackra/actions": minor
---

Add the `DeviceStatusReader` port (with `MemoryDeviceStatusReaderDriver`) and `DeviceRevokedError`: with a reader bound,
the pipeline refuses a call from a revoked device (`device_revoked`, 403) before device order, so nothing runs and its
sequence is not settled. With no reader bound nothing changes.

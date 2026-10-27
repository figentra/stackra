---
"@stackra/filesystem": minor
---

Add `FilesystemHealthIndicatorDriver`, the `HealthIndicator` named `filesystem` that asks the disk whether `health.path` exists, and the `health` field of `FilesystemConfig` (probe timeout `PT2S`, `critical`, `path`) (STA-1379).

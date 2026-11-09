---
"@stackra/fiscal": patch
---

`EtaDriver` now reads a rejected submission's reference from `submissionUUID`, the name ETA's SDK uses, and falls back to `submissionId`. Before this, a real ETA answer left the reference empty.

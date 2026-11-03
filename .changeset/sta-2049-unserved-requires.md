---
"@stackra/infra-aws-runtime": patch
---

`runtimePlan` refuses a dedicated Valkey `requires` entry that no environment's cache driver serves, with a `RunwayInvalidError` at `requires.<name>` (STA-2049).

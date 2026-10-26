---
"@stackra/loyalty-kit": patch
"@stackra/ui": patch
"@stackra/infra-observability": patch
"@stackra/queue": patch
"@stackra/scheduler": patch
"@stackra/integrations": patch
---

Make every declaration emit self-contained (TS2883, STA-1220): explicit types on `TierMultiplierExtension`'s base,
`Dropdown`, the observability stack functions, `JOB_TYPES` and `SCHEDULED_JOBS`, and the type `PassBase` exported from
`@stackra/integrations` so a consumer's `extends Pass({ key })` class can be declared.

---
"@stackra/gen": patch
---

Gen's `registrations.ts` no longer imports an Integration that has no Connection: it was imported and never read, which
failed a consumer's `noUnusedLocals` (TS6133).

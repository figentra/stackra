---
"@stackra/support": minor
---

Add `canonicalJson` and `canonicalHash`, the one canonical form (sorted keys, `undefined` dropped, ISO dates) and its
SHA-256 that hash chains, signed checkpoints and content addresses share, byte for byte the form
`@stackra/access-log` already chains over (ADR 0416); and `time.addMonths` / `time.subMonths`, calendar-month shifts on
the UTC calendar with the day clamped to the month's end, for billing periods.

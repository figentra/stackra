---
"@stackra/gen": patch
---

A package's `src/node/entities.gen.ts` is stable under gen. Gen counted any `[OptionalProps]` under `src/` as one the
member wrote beside its model, and so read its own last augmentation in `entities.gen.ts` as authored: it wrote none
(`optional: []`), and the next run wrote it back. The committed file flipped on every run, and the gate's "Committed
manifests match gen" passed or failed by which version was there before (stackra#1030 to #1032, `TenantDataKey`).
Gen now ignores its own entities file in that check; a member's own `[OptionalProps]` still wins (STA-1750).

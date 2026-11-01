---
"@stackra/gen": minor
---

The schemas file now augments each shape that has initializers with `declare module "<its import path>"`, naming them in
the type-only `~defaults` brand (STA-1694), so `CallInput` can make the defaulted fields optional. Regenerate to pick it
up.

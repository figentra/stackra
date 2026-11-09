---
"@stackra/cli": patch
---

The duplicate-export check now exempts five names that two packages each declare for a different concept: `FooterLink`, `RawBody`, `Surface`, `SurfaceKind` and `settingsKeyOf`. Each entry gives its reason. `validate` on main no longer reports them.

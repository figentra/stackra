---
"@stackra/market-packs": patch
---

<!-- Purpose: release note for the typed market-pack section reader. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0418; STA-1726. -->

`ResolvedPackSource.sectionFor(market, Section, options?)` reads a whole pack section as a typed `Schema` instance in
one resolve: the class's `static readonly packPrefix` names the section, each field reads `<packPrefix>.<snake(field)>`
with the overlay order of `resolvePack`, and a key no layer has takes the field's default.

---
"@stackra/assets": minor
---

Add `@stackra/assets`, the module assets of the programming model v3.1: `assets(tree)` in `.`, which builds the
generated `#stackra/assets` constants (`Assets.orders.public.logo_svg`) and refuses malformed `<module>::<kind>/<path>`
keys, misplaced entries and non-relative source files; `AssetLibrary`, which resolves a public asset to the URL of
`<module>/<kind>/<path>` on the injected `FileSystem` disk and reads any asset's bytes or UTF-8 text; the `AssetEntry`,
`AssetKey`, `AssetTree` and `ResolvedAsset` types; and `useAsset(entry)` in `./react`. Overrides are settled by gen from
the host's `src/overrides/<owner>/` tree (ADR 0306); nothing at runtime reads it.

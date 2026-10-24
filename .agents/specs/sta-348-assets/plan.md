# Plan: `@stackra/assets` wave 3

**Spec**: `.agents/specs/sta-348-assets/spec.md`

## Design

- `AssetKey` is the template-literal type `` `${string}::${string}/${string}` ``; `AssetEntry<K>` is
  `{ key, file, overridable }`; `AssetTree` is module, kind, leaf; `ResolvedAsset<K>` is `{ key, file, url }`.
- `parseAssetKey` (internal) splits and checks a key: kebab-case module and kind, a path that passes `isRelativePath`
  (internal). Kind folders are not a closed list here; gen owns that check.
- `assets<const T extends AssetTree>(tree: T): T` checks each entry against its place in the tree and returns frozen
  copies, the shape `flagRefs` uses in `@stackra/feature-flags`.
- `AssetLibrary extends Service` takes `FileSystem` (from `@stackra/filesystem/contracts`). The published disk path is
  `<module>/<kind>/<path>`; `resolve` refuses a non-public kind and uses `FileSystem.url`; `read` and `text` use
  `FileSystem.read`. Named `AssetLibrary` so it never clashes with the generated `Assets` constant.
- `useAsset(entry)` is `useContainer().get(AssetLibrary).resolve(entry)`, the shape `usePrefs` uses.

## Constitution check

- Boundaries: imports `@stackra/container`, `@stackra/contracts` (member definition) and `@stackra/filesystem`;
  `./react` imports `.`; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; no new catalog entry.
- Naming: v3.1; files `<name>.<kind>.ts`; the service class takes no suffix, as `FlagReader` and `EventBus` do.
- Secrets: none.
- No parameter properties and no `#private` fields.

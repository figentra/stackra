# @stackra/assets

Stackra module assets: the files a module ships with its code (images, prompt templates, evaluation sets, seed data),
addressed by `<module>::<kind>/<path>` keys. `stackra gen` writes the typed constants into `#stackra/assets` with
`assets()`; `AssetLibrary` resolves a public asset's URL and reads any asset's bytes over a filesystem disk; `useAsset`
is the React hook.

**Tier:** `tier:lib` (`packages/data/assets`). Entries `.` and `./react`. Depends on `@stackra/contracts`,
`@stackra/container` and `@stackra/filesystem`; React is an optional peer of `./react`.

## What is here

| Entry     | Symbol                       | Use                                                                         |
| --------- | ---------------------------- | --------------------------------------------------------------------------- |
| `.`       | `assets`                     | builds the generated `Assets` tree; checks and freezes every entry          |
| `.`       | `AssetLibrary`               | `resolve(entry)` (public URL), `read(entry)` (bytes), `text(entry)` (UTF-8) |
| `.`       | `AssetEntry`, `AssetKey`     | types: `{ key, file, overridable }`, `` `${string}::${string}/${string}` `` |
| `.`       | `AssetTree`, `ResolvedAsset` | types: module, kind, leaf; `{ key, file, url }`                             |
| `./react` | `useAsset`                   | the `ResolvedAsset` of a public asset, from the nearest container           |

## Keys and files

A module's files sit in `assets/<kind>/` (ADR 0234): `public/` has a URL, the other kind folders (`data/`, `ai/`,
`templates/`, ...) are read only. The key is `<module>::<kind>/<path>`, and gen names the leaf after the snake-cased
file name with its extension, so `logo.svg` and `logo.png` never collide:

```ts
// .stackra/gen/assets.ts (generated)
export const Assets = assets({
  orders: {
    public: {
      logo_svg: {
        key: "orders::public/logo.svg",
        file: "assets/public/orders/logo.svg",
        overridable: true,
      },
    },
  },
});
```

`assets()` refuses an entry whose key is malformed or sits under another module or kind than its place in the tree,
whose `file` is not relative to the member root, or whose `overridable` is not a boolean.

## Using an asset

```tsx
// a component
const logo = useAsset(Assets.console.public.logo_svg);
return <img src={logo.url} alt="" />;

// a service
constructor(library: AssetLibrary) { ... }
const prompt = await this.library.text(Assets.orders.ai.explain_order_md);
```

An asset is published at `<module>/<kind>/<path>` on the bound `FileSystem` disk, derived from the key alone, so an app,
a service and a package resolve the same way. The URL is the disk's `filesystem.url` plus that path. Only `public/`
assets get a URL; `resolve` throws for any other kind. `useAsset` throws outside a `ContainerProvider` or when the
container does not bind `AssetLibrary`.

## Data assets

A `data/` asset (a jurisdiction rule pack, a reference table) ships as `assets/data/<name>.data.json` beside
`<name>.schema.json`. Gen validates it against the schema at build and writes its `version` and SHA-256 `hash` into
the entry. Before a module starts, the runtime calls `library.verify(moduleAssets)`; a shipped file whose bytes differ
throws `AssetHashMismatchError` (an `Internal` refusal) and the module does not start. `library.json(entry)` reads one
after the same check.

## Overrides

A host replaces an overridable asset with a file at the same path under its one overrides tree,
`src/overrides/<owner>/...` (ADR 0306). Gen settles the shadow at build time: the entry's `file` names the winner and
the publish step copies it under the owner's key. Nothing at runtime reads the overrides tree.

## Not here

- Language files: their keys and loaders are `#stackra/i18n`.
- Uploads and tenant files: `@stackra/media` and the files service (ADR 0234 decision 11).
- Content hashing of published files: the publish step's job.

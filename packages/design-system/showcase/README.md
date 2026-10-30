# @stackra/showcase

The one component registry of the Stackra showcases (web playground and mobile app): categories, one entry per
component, HeroUI docs links, the `showcase` lang catalogues, the generated API docs and the search index.

**Tier:** `tier:lib` (`packages/design-system/showcase`). Data and pure functions only; no React.

## Entry points

| Import                                                 | Holds                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `@stackra/showcase`                                    | enums, types, zod schemas, `COMPONENTS`, `CATEGORIES` and the registry functions |
| `@stackra/showcase/api/<platform>/<tier>/<slug>.json`  | the generated `ApiDoc` of one entry (WP2)                                        |
| `@stackra/showcase/search`                             | the generated `SearchDoc[]` (WP2)                                                |
| `@stackra/showcase/assets/lang/<locale>/showcase.json` | the `showcase::` catalogue (en, ar)                                              |

## Structure

```text
src/enums/                         ComponentCategory, ComponentTier, ComponentStatus, Platform, ComponentSection, DocTab, …
src/types/                         ComponentEntry, ExampleEntry, HeroLink, ApiDoc, SearchDoc, … (one per file)
src/schemas/                       zod: ComponentEntrySchema, ApiDocSchema, SearchDocSchema
src/registry/categories.constant.ts   CATEGORIES
src/registry/components/<tier>/<slug>.ts   one file per entry (agents never touch the same file)
src/registry/components.generated.ts       COMPONENTS, the barrel (Metro has no glob)
src/registry/*.function.ts         webPath, byWebPath, bySlug, byCategory, neighbours, importLine, componentKeys,
                                   categoryPath, categoryFromSegment, mobileRoute, matchEntries, checkRegistry, …
assets/lang/{en,ar}/showcase.json  titles, descriptions, keywords, example titles, sections and UI words
```

## Adding a component

1. Add `src/registry/components/<tier>/<slug>.ts` exporting `<TIER>_<SLUG>: ComponentEntry`; `examples[0]` is Usage
   and exactly one example has `card: true`.
2. Add it to `components.generated.ts` (gen-barrel writes it once WP2 lands).
3. Add `component.<tier>.<slug_snake>.{title,description,keywords}` and `example.<tier>.<slug_snake>.<id_snake>.title`
   to **both** `assets/lang/en/showcase.json` and `assets/lang/ar/showcase.json`.
4. Add the demo files `apps/playground/src/demos/<tier>/<slug>/<id>.tsx` and `apps/mobile/src/demos/…` per platform.

`pnpm -F @stackra/showcase test` runs the registry gate (`check-registry.test.ts`): it fails on a bad shape, a
duplicate key, a missing card example, a bad HeroUI URL, any `showcase` key missing in English or Arabic, and any
current web route or mobile screen that maps to no entry. Missing demos and hidden Pro docs links are printed, not
fatal, until the demo codemods land.

## Rules

- Keys and paths are derived, never stored: key `<tier>/<slug>`, web path `/<slug>` or `/pro-<slug>`, category path
  `/components/<category-kebab>`, mobile route `Component { tier, slug, tab?, example? }`, catalogue keys in snake_case.
- Component titles stay Latin in Arabic (they name code). Prop names, types, defaults and code are never translated.
- `planned` entries are registered gaps (P1 list): no examples, no demos, shown with a "Planned" chip.

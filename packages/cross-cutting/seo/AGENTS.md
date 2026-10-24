# AGENTS — @stackra/seo

Sitemaps, robots groups, the JSON-LD escaper, canonical redirects, alternates and locale paths, the SEO chain and the
Open Graph renderer (ADR 0301). Member at `packages/cross-cutting/seo` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./server`, `./worker`.

## Where code goes

| You are writing…                      | It goes in…                                        |
| ------------------------------------- | -------------------------------------------------- |
| The configuration (`SeoConfig`)       | `src/config/seo.config.ts`                         |
| Its options shape                     | `src/core/schemas/seo-options.schema.ts`           |
| Its shipped zod schema (`SeoConfig$`) | `src/core/constants/seo-config-schema.constant.ts` |
| An enum                               | `src/core/enums/<name>.enum.ts`                    |
| A function, a type                    | `src/core/{functions,types}/`                      |
| The port and the card type            | `src/contracts/{ports,types}/`                     |
| Node-only code                        | `src/server/`                                      |
| Worker-only code                      | `src/worker/`                                      |
| A test                                | `__tests__/<name>.<kind>.test.ts` beside it        |

## Entries and barrels

- `src/{core,contracts,server,worker}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's barrel test.
- `SeoConfig$` mirrors `SeoOptions` by hand until gen compiles this package's schemas; change both together. Every field
  keeps a default and no object-level refinement, so gen's override schema can `.extend` it.
- `alternates`, `localePath` and everything else in `.` stay free of Node and Worker APIs: client route code imports
  them (ADR 0301 decision 6).

## This package

- Structured data is written only through `serializeJsonLd`; `resolveSeo` returns it escaped. Never write JSON-LD raw.
- A robots rule belongs to one group; a robots value with a line break is refused, never stripped.
- A sitemap file stays within 50,000 URLs and 50 MB; the writers refuse a bigger one instead of truncating it.
- Canonical redirects depend on the URL alone, never on a cookie, a header or the visitor.
- The Open Graph card's tenant input (colours, picture URL, title length) is checked in `ogCardTree`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data             | Where                   | Handling                                                |
| ---------------- | ----------------------- | ------------------------------------------------------- |
| Site and product | titles, paths, pictures | public catalogue data only; nothing about a visitor     |
| Secrets          | none                    | the renderer fetches public fonts and pictures, no keys |

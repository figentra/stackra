# `packages/design-system/`

The Stackra Design System: one token schema and one component API for the web and native apps. One folder per
package, `packages/design-system/<name>`, published as `@stackra/<name>`
([ADR 0302](../../apps/docs/src/adr/0302-stackra-design-system-tokens-ui-and-the-playground.mdx)).

**Today:** [`tokens`](tokens) (`@stackra/tokens`): the theme schema, the default stackra theme, its HeroUI v3 web CSS
and its HeroUI Native / Uniwind CSS, and the theme's fonts. [`ui`](ui) (`@stackra/ui`): the component API, contracts
shared, HeroUI v3 on web and HeroUI Native with Uniwind on native.

**Planned here:** icons. A product brings its own brand as a theme for `@stackra/tokens`; Stackra's own logos and brand
assets live in the docs app (`apps/docs/src/assets/brand/`).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category design-system --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

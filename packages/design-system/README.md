<!-- Purpose: the index of the design-system category (tokens, ui) and the rules its packages follow. Boundary: category index only; each package documents itself. Runtime: docs. Governing contract: ADR 0302, ADR 0461 (decision 3). -->

# `packages/design-system/`

The Stackra Design System: one token schema and one component API for the web and native apps. One folder per
package, `packages/design-system/<name>`, named `@stackra/<name>`
([ADR 0302](../../apps/docs/src/docs/adr/0302-stackra-design-system-tokens-ui-and-the-playground.mdx)).

**Today:** [`tokens`](tokens) (`@stackra/tokens`): the theme schema, the default stackra theme, its HeroUI v3 web CSS
and its HeroUI Native / Uniwind CSS, and the theme's fonts. [`ui`](ui) (`@stackra/ui`): the component API, contracts
shared, HeroUI v3 on web and HeroUI Native with Uniwind on native. The HeroUI Pro wrappers, `@stackra-pro/ui`, moved
to figentra/stackra-pro and are internal-only on the Stackra registry
([ADR 0461](../../apps/docs/src/docs/adr/0461-the-pro-line-for-0-1-0-runtime-free-behind-entitlements-paid-studios-and-advanced-drivers.mdx)
decision 3).

**Planned here:** icons. A product brings its own brand as a theme for `@stackra/tokens`; Stackra's own logos and brand
assets live in the docs app (`apps/docs/src/assets/brand/`).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category design-system --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

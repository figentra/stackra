# `packages/experience/`

UI building blocks for the web and native apps. One folder per package, `packages/experience/<name>`, published as `@stackra/<name>`.

**Today:** [`brand`](brand) (`@stackra/brand`): tokens, HeroUI themes, fonts, logos and icons.

**Planned here** ([ADR 0127](../../apps/docs/src/adr/0127-package-categories-including-infrastructure.mdx)): ui, experience, navigation, console, panel.
The order is the [roadmap](../../apps/docs/src/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category experience --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

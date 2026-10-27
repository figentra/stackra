# `packages/cross-cutting/`

Concerns that every layer shares. One folder per package, `packages/cross-cutting/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/docs/adr/0127-package-categories-including-infrastructure.mdx)): concerns that span layers. The brand moved out: its
tokens are the stackra theme in [`@stackra/tokens`](../design-system/tokens), its assets live in the docs app
([ADR 0302](../../apps/docs/src/docs/adr/0302-stackra-design-system-tokens-ui-and-the-playground.mdx)).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category cross-cutting --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

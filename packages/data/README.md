# `packages/data/`

Models, persistence and stored content. One folder per package, `packages/data/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/adr/0127-package-categories-including-infrastructure.mdx)): model, database, content, media, search, state-machine.
The order is the [roadmap](../../apps/docs/src/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category data` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

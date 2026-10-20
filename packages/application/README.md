# `packages/application/`

Turning declarations into running behaviour: actions, codegen and AI. One folder per package, `packages/application/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/adr/0127-package-categories-including-infrastructure.mdx)): actions, ai, ir, registry.
The order is the [roadmap](../../apps/docs/src/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category application` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

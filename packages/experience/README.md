# `packages/experience/`

Experience building blocks for the web and native apps: navigation, console, panel and builder. One folder per package, `packages/experience/<name>`, published as `@stackra/<name>`.

**Today:** No package yet. The UI components and tokens live in [`design-system/`](../design-system).

**Planned here** ([ADR 0127](../../apps/docs/src/docs/adr/0127-package-categories-including-infrastructure.mdx)): experience, navigation, console, panel.
The order is the [roadmap](../../apps/docs/src/docs/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category experience --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

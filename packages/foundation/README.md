# `packages/foundation/`

The kernel every other package builds on. One folder per package, `packages/foundation/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/docs/adr/0127-package-categories-including-infrastructure.mdx)): contracts, validation, errors. Draft specs for contracts, support, container, config, logger, validation and events are in [`.agents/specs`](../../.agents/specs) (STA-74 to STA-80).
The order is the [roadmap](../../apps/docs/src/docs/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category foundation --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

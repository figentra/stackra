# `packages/runtime/`

Running work outside the request: messaging, scheduling and workflows. One folder per package, `packages/runtime/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/adr/0127-package-categories-including-infrastructure.mdx)): outbox, queue, scheduler, workflow, realtime, locking, cache.
The order is the [roadmap](../../apps/docs/src/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category runtime --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

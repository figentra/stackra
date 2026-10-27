# `packages/communication/`

Talking to the outside world. One folder per package, `packages/communication/<name>`, published as `@stackra/<name>`.

**Today:** No package yet.

**Planned here** ([ADR 0127](../../apps/docs/src/docs/adr/0127-package-categories-including-infrastructure.mdx)): webhooks, notifications, versioning, integrations (integrations assumed, pending the owner).
The order is the [roadmap](../../apps/docs/src/docs/roadmap.mdx).

## Rules

- Packages sit flat inside the category; `pnpm new package <name> --category communication --description "<one sentence>"` creates one.
- The rules of [`packages/`](../README.md) apply: `tier:lib`, catalogs only, `__tests__/`, no import of an app, a
  service, `encore.dev` or another package's `src/`.

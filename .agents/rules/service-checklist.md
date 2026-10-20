---
title: Service checklist
description: The eight things a complete service has before it is done.
always: false
applies_to: ["services/**"]
manual: false
---

# Service checklist

A service is `services/<name>`, `@figentra/service-<name>`, tag `tier:service`, entry `src/main.ts`. Eight non-negotiables:

1. **Placement, one file per primitive.** The placement test passes (`module-boundary`). Once needed: `api.ts`,
   `db.ts`, `events.ts`, `jobs.ts`, `cache.ts`, each declaring literal primitives only.
2. **Two-layer tenant isolation** once a tenant-owned table exists (see `tenancy`).
3. **Event-first.** Cross-service communication is a versioned event unless an authoritative decision is needed now.
4. **One gateway.** No service sets CORS or exposes a public surface of its own; the generated
   `encore.app` in `.stackra/encore` (ADRs 0091, 0124) is the only gateway; services hold no Encore files.
5. **Idempotency on every write** (`http-conventions`).
6. **Required files:** `README.md`, `AGENTS.md` with a `## PII` table (even if "none"), `CHANGELOG.md`, `LICENSE`,
   `isolation.test.ts` once a scoped table exists.
7. **Secrets:** declared by name only, value set by a human (`secrets`). Tests need none.
8. **Definition of done:** code, `pnpm verify` green, the service's own tests green, docs current, reviewer
   sign-off. `pnpm verify` never starts a service, so a typecheck is not proof it runs.

Enforcement: `tools/scripts/validate-repository.mjs` (member shape, `checkService`, tier tag); items 2-5 and 8
are reviewer-checked (planned checks). Docs: `apps/docs/src/standards/services.mdx`.

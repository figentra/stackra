# AGENTS — {{NAME}} service

Lives in `services/src/{{NAME}}/` of the one Encore app (`@stackra/backend`). Global rules in `~/.claude/rules/`
(module boundary, tenancy, secrets, HTTP conventions, service checklist) apply.

- One primitive per file, literal declarations only: `encore.service.ts`, and `db.ts` / `events.ts` / `jobs.ts` /
  `cache.ts` only once the service owns that primitive.
- One `api()` per operation with typed request/response; `auth: true` by default. A public endpoint carries a
  comment saying why (`status` is public only until identity's `authHandler` exists).
- Errors are `APIError.*` with a stable message, never a bare `Error`.
- Other services are called only through `~encore/clients`; never import another service's files (a `Topic` from
  its `events.ts` is the one exception).
- Once a tenant-owned table exists: every query inside `withTenant()`/`withScope()`, RLS `ENABLE` + `FORCE` on the
  table, and an `isolation.test.ts`.
- Writes require an `Idempotency-Key`.
- Secrets: `secret("Name")` only; a human sets the value. Never a value in a file, test or log.
- Tests sit in `__tests__/` beside the code (ADR 0022); run them with `pnpm --filter @stackra/backend test` (`encore test`).

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |

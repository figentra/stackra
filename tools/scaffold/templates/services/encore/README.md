# {{NAME}} service

{{DESCRIPTION}}

One Encore service inside `@stackra/backend` (`services/`), the single Encore app. It is not a workspace member:
it has no `package.json`, and the app's own tasks (`pnpm backend`, `encore test`, typecheck, lint) cover it.

The service name and path prefix are `{{NAME}}`.

| Endpoint             | Auth                          | Does                     |
| -------------------- | ----------------------------- | ------------------------ |
| `GET /<name>/status` | public (no `authHandler` yet) | Liveness of this service |

## Structure

| File                    | Holds                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| `encore.service.ts`     | The literal `new Service(...)` declaration                                 |
| `api.ts`                | One `api()` per operation, typed request/response                          |
| `__tests__/api.test.ts` | Tests in `__tests__/` (ADR 0022); picked up by `services/vitest.config.ts` |

Add `db.ts`, `events.ts`, `jobs.ts`, `cache.ts` only when the service owns that primitive.

## Run

```bash
pnpm backend                          # encore run — the whole app, this service included
pnpm --filter @stackra/backend test   # encore test
```

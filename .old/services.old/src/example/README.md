# example service

Owns a sample greeting endpoint that demonstrates calling another service (health) through `~encore/clients`.

## Endpoints

| Method       | Path | Auth | Does                                                                      |
| ------------ | ---- | ---- | ------------------------------------------------------------------------- |
| see `api.ts` |      |      | `hello({ name })` greets the trimmed name and reports the health upstream |

## Test

`pnpm --filter @stackra/backend test` (runs `encore test`). The test calls `hello` directly and reaches health through the generated client.

# health service

Owns the liveness endpoint used by load balancers and uptime checks. No data, no database.

## Endpoints

| Method | Path      | Auth   | Does                       |
| ------ | --------- | ------ | -------------------------- |
| GET    | `/health` | public | Returns `{ status: "ok" }` |

## Test

`pnpm --filter @stackra/backend test` (runs `encore test`).

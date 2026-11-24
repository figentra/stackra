# @figentra/service-health

The reference health service: two probe routes any deploy check, load balancer or orchestrator can call, and the way a
Stackra service says "I am up" and "I can serve". Plain TypeScript, no Encore file here (ADR 0124): `stackra gen`
writes the Encore app into `.stackra/`, and nobody writes `main.ts`. See [`services/`](../README.md) for the rules.

| Route          | Question                | Answers                                                                                                              |
| -------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GET /healthz` | Is the process up?      | `200 {"status":"up"}`. A draining app refuses the call before it reaches the route, which the adapter answers `503`. |
| `GET /readyz`  | Can the service serve?  | `200` when no check is `down`, else `503`; the body is a status per check: `{"database":"up","migrations":"up",...}` |

Both take `GET` and `HEAD` (a `HEAD` gets the status and headers, no body) and answer any other method `405` with
`Allow: GET, HEAD`. Both are raw endpoints (`Controller` in `src/modules/health/raw/`), so they take no session and run
behind every request guard. Neither is cached (`Cache-Control: no-store`). The service's area is `public`.

## What `/readyz` checks

Each check is capped at three seconds; one that throws or does not answer in time is `down`; `degraded` still serves. The
body names the failing dependency and never carries a check's detail (no host, no error text).

| Check        | From                                      | `up` when                                                                                                      |
| ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `database`   | `@stackra/database` (gen binds it)        | `select 1` answers in time (and, with `health.rowSecurity`, the role cannot bypass row-level security).        |
| `queue`      | `@stackra/queue` (gen binds it)           | the queue driver answers.                                                                                      |
| `migrations` | `MigrationsCheckService` (this service)   | `schema_migrations` holds one clean version and every table this build's models need exists.                   |
| `pipeline`   | `PipelineCheckService` (this service)     | `health.ping.check`, a query only the platform actor may call, runs through the real actions pipeline and `up`. |

Every `HealthIndicator` the container binds is run (`DiscoveryService.getAll`), plus the two checks above. A service of
your own that wants a readiness check authors it the same way: a `Service` with a `name` and a `check()`, and adds it to
the readiness service's list.

## Layout

```text
stackra.config.ts                      defineService({ area: ApiArea.Public })
src/modules/health/
  raw/liveness.controller.ts           GET /healthz
  raw/readiness.controller.ts          GET /readyz
  services/readiness.service.ts        runs the checks, builds the answer
  services/migrations-check.service.ts the migrations check
  services/pipeline-check.service.ts   the pipeline check
  queries/ping.query.ts                health.ping.check@1: system actor only, no endpoint, no tool
  access/ping.permissions.ts           health.ping.read (L0)
```

## Commands

| Command                    | Does                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `stackra gen`              | Writes the wiring, entries and Encore app into `.stackra/` (needs the root runway's Encore app id) |
| `stackra gen --manifests`  | Writes only `stackra.manifest.json` (what core checks today)                   |
| `stackra test`             | The unit tests                                                                 |
| `stackra test --tier int`  | 9 integration tests on a real Postgres (Docker): the migrations check against the real runner's ledger (5), and `GET /readyz` end to end, 200 then 503 with the failed check named and nothing of its detail (4) |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                                           |

---
"@stackra/testing": minor
"@stackra/vitest-config": minor
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/actions": patch
"@stackra/queue": patch
"@stackra/outbox": patch
---

The load tier of ADR 0182 (decisions 1 and 4). A `<subject>.load.test.ts` in a package or service serves its subject in
its own process and drives it with k6, then checks what the subject did with the load and keeps the numbers.

- `@stackra/testing/node` (new entry): `serveLoadTarget` (a loopback HTTP target whose `POST /scenarios/<name>` runs one
  unit of a scenario and times it server-side), `runK6` (one `k6 run` of a built-in script, answering the summary and the
  crossed thresholds), `soakLoad` (an arrival-rate load that `STACKRA_LOAD_RATE` and `STACKRA_LOAD_DURATION` stretch
  into a soak), `k6Binary` (`STACKRA_K6`, else `k6` on `PATH`; a load test skips without one), `writeLoadReport`
  (`<STACKRA_LOAD_REPORT_DIR>/<name>.json`) and the latency helpers.
- `@stackra/vitest-config/load` (new entry): `loadTier`, which narrows a member's config to the `.load.test.ts` files,
  one file and one test at a time, no retry, a two-hour timeout.
- `@stackra/gen` writes `.stackra/vitest.load.config.ts` for a member with a `.load.test.ts`.
- `@stackra/cli`: `stackra test --tier load` runs it in a member; at the workspace root it runs `turbo run test:load --concurrency=1`, so two members' soaks never share the box.
- `@stackra/actions`, `@stackra/queue` and `@stackra/outbox` gain a `test:load` script and their first soaks: the action
  pipeline, the queue (four workers on Postgres) and the outbox relay (two relays on one lock, on Postgres), each
  checking every unit of work ran exactly once inside its ceilings, plus a backlog-drain test for the queue and the
  relay that measures their ceiling.

The weekly `load.yml` workflow runs the tier with a ten-minute soak per file and uploads the reports; the capacity
runbook records the measured numbers.

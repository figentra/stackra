---
"@stackra/queue": minor
"@stackra/scheduler": minor
"@stackra/outbox": minor
"@stackra/infra-observability": patch
---

Background jobs now send the heartbeats `@stackra/infra-observability` declares for them (ADR 0184 decision 4), so a
dead scheduler, relay or worker opens an incident instead of going unnoticed.

`@stackra/queue` adds `HeartbeatService` (`beat(job)`), its configuration `HeartbeatConfig` (key `queue.heartbeat`:
the `STACKRA_HEARTBEAT_URLS` secret, a JSON object of job name to `https://` URL, plus `minInterval` and `timeout`) and
`heartbeatName`. The queue worker beats `queue-<queue>` on each loop pass that reached its store; the outbox relays beat
`outbox-relay` and `cross-app-relay` after each completed poll; the scheduler beats each cron's CronJob id once its runs
are pushed (by `tick` or `fire`) and `scheduler-schedules` after a tick with no failed push. With no secret set nothing
is sent. A beat never throws, is abandoned after `timeout` (3 s), is sent at most once per `minInterval` (10 s) per job,
and a failure is logged as `queue.heartbeat_failed` with the job name only, never the URL.

To turn heartbeats on, copy the stack output `heartbeats.<environment>.<service>` into the service's
`STACKRA_HEARTBEAT_URLS` secret in sops.

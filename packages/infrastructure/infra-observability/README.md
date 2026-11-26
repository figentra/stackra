# @stackra/infra-observability

Telemetry infrastructure (ADR 0171, ADR 0184): where every service's OpenTelemetry goes and how long its logs are
kept, a heartbeat for every cron, outbox relay and queue worker, an uptime monitor for every public URL the runway
lists, the Sentry projects and alerts of the app members, and the service-level indicators of every service, read from the runways and declared by the slice of the generated
Pulumi program for the core stack.

**Tier:** `tier:lib` (`packages/infrastructure/infra-observability`). Entries `.` (isomorphic, no Pulumi) and
`./node` (the Pulumi programs). Depends on `@stackra/contracts`, `@stackra/runway`, zod, `@pulumi/pulumi` (peer),
`@pulumi/aws`, `@pulumiverse/sentry`, `pulumi-logtail` and `pulumi-better-uptime`.

## What is here

| Entry    | Symbol                                                           | Use                                                                                                      |
| -------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `.`      | `observabilityPlan(root, members)`                               | the telemetry plan from the root runway, the app runways and the jobs                                    |
| `.`      | `prometheusSloRules(plan, options?)`                             | the plan's objectives as Prometheus recording and burn-rate alerting rules (the LGTM stack's ruler)      |
| `.`      | `HeartbeatKind`, `SliKind`                                       | enums of snake_case codes                                                                                |
| `.`      | `ObservabilityConfigInvalidError`                                | every runway or job failure at once, with its path                                                       |
| `.`      | `ObservabilityHealthIndicatorDriver`, `InfraObservabilityConfig` | the `HealthIndicator` driver: the telemetry endpoint answers; its target is `config.infra_observability` |
| `.`      | `ObservabilityPlan`, `HeartbeatSource`, …                        | types                                                                                                    |
| `./node` | `observabilityStack(plan)`                                       | inside the Pulumi program: every resource of the plan, and its outputs                                   |
| `./node` | `logPipeline`, `sentryProjects`, `heartbeatMonitors`             | the parts, for a stack that composes its own                                                             |
| `./node` | `uptimeMonitors`, `statusPage`                                   | the uptime monitors of public URLs and the status page, for a stack that composes its own                |

`heartbeatMonitors`, `uptimeMonitors`, `logPipeline`, `statusPage` and `observabilityStack` declare their return types, so the
declarations name the Better Stack classes through `pulumi-better-uptime` and `pulumi-logtail`, not their `bin/` files
(STA-1220).

## Where the facts come from

| Fact                                       | Source                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Project (Sentry team, resource names)      | root `project`                                                              |
| Deployed environments (alerts, heartbeats) | root `environments`, without `dev` and `preview`                            |
| Log retention                              | root `observability.logs.{hotDays,coldMonths,coldStore}` (30, 13, `s3`)     |
| Which jobs send heartbeats                 | root `observability.heartbeats.{crons,relays,workers}` (all on)             |
| When objectives start                      | root `observability.slos.startAt` (`first-paying-tenant`)                   |
| The objectives and their window            | root `observability.slos.objectives`, `slos.windowDays` (none, 30)          |
| Public URLs probed from outside            | root `observability.uptime` (none)                                          |
| The OTLP destination                       | root `providers.betterstack` (named: a Better Stack source is declared)     |
| Sentry organization                        | root `providers.sentry.org` (a slug, never a `ref:`)                        |
| Sentry project of an app                   | app runway `telemetry.sentryProject`                                        |
| The services and their jobs                | the caller: service member keys and `HeartbeatSource`s from their manifests |

Omitted `observability` keys take the ADR 0184 values in brackets. `@stackra/runway` leaves the section open; this
package is its check, and a misspelt key fails.

```ts
import { HeartbeatKind, observabilityPlan } from "@stackra/infra-observability";
import { readRunway } from "@stackra/runway/node";

const plan = observabilityPlan(readRunway("runway.yaml", "root"), {
  apps: { web: readRunway("apps/web/runway.yaml", "app") },
  services: ["commerce", "notifications"],
  heartbeats: [
    {
      service: "commerce",
      kind: HeartbeatKind.Cron,
      name: "nightly-export",
      periodSeconds: 86_400,
    },
  ],
});

// .stackra/infra/index.ts (generated by `stackra infra gen`)
import { observabilityStack } from "@stackra/infra-observability/node";
export const observability = observabilityStack(plan).outputs;
```

## What the stack declares

| Part                | Resources                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logPipeline`       | a Better Stack source (`open_telemetry`, logs searchable `hotDays`) and, with `coldMonths` above 0, a private S3 archive the source writes and keeps, expiring after the full calendar months |
| `sentryProjects`    | a team named after the project, a project and DSN key per app, and per deployed environment an alert that mails the issue's owners when an issue is first seen or regresses                   |
| `heartbeatMonitors` | a Better Stack heartbeat per deployed environment and job: period from the job, grace a fifth of it, a miss mails and pushes whoever is on call                                               |
| `uptimeMonitors`    | a Better Stack uptime monitor per `observability.uptime` entry: the URL every `checkFrequencySeconds`, up on 2xx or on `expectedStatusCodes`, a miss mails and pushes whoever is on call      |

The archive user may only list, read, write and delete in its bucket: Better Stack writes a custom bucket with an
access key only, so its secret stays in the encrypted Pulumi state and in Better Stack.

## Uptime

`observability.uptime` lists the public URLs Better Stack probes from outside, the guard for a host that is down while
nothing inside it can report. Each entry is a kebab-case `name` (unique), an `https://` `url`, the `environment` it
belongs to (default `production`, a monitored one), `checkFrequencySeconds` (at least 30, default 60) and
`expectedStatusCodes` (default: any 2xx; a token-guarded route that answers 401 when healthy names `[401]`).

```yaml
observability:
  uptime:
    - name: registry
      url: https://npm.stackra.figentra.com/-/ping
      checkFrequencySeconds: 30
    - name: turbo-cache
      url: https://turbo.stackra.figentra.com/v8/artifacts/status
      expectedStatusCodes: [401]
```

## Status page

`observability.statusPage` (ADR 0185 decision 3, ADR 0402) declares a Better Stack status page with one section per
listed environment and an entry per heartbeat and uptime monitor of it; `published` says whether the public sees it yet.

```yaml
observability:
  statusPage:
    subdomain: acme-status
    companyName: Acme
    companyUrl: https://acme.example
    timezone: Asia/Riyadh
    customDomain: status.acme.example
    published: false # true from the first external customer
    environments: [production]
```

## Outputs

`observabilityStack(plan).outputs` mirrors the `ref:` paths the runways name, so the stacks repository copies each
into the stack config the deploy reads:

| Output                                      | Read as                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `otlp.endpoint`                             | `ref:otlp.endpoint` (root `providers.otlp.endpoint`)     |
| `otlp.token` (secret)                       | the services' OTLP header, a runtime secret in sops      |
| `betterstack.source`                        | `ref:betterstack.source`                                 |
| `sentry.dsn.<member>`                       | `ref:sentry.dsn.<member>` (an app's `VITE_SENTRY_DSN`)   |
| `heartbeats.<env>.<service>.<job>` (secret) | the URL the job beats, a runtime secret in sops          |
| `slis`                                      | the indicators, for dashboards                           |
| `slos`                                      | the objectives and their burn-rate alerts                |

## Indicators

Every service gets two indicators over the stable OpenTelemetry histogram `http.server.request.duration` (ADR 0184
decision 3): availability, the requests whose `http.response.status_code` is below 500 against all requests, and
latency at the 95th and 99th percentiles. They are measurements, backend-neutral, so the same definitions read Better
Stack or the on-premises LGTM stack. Objectives start at the first paying tenant (`slos.startAt`); none is declared
before then.

## Objectives and burn-rate alerts

From then, the root runway declares one entry per service under `observability.slos.objectives`: an availability
target (percent of requests without a 5xx), a latency target (percent of requests within `thresholdMs`, a bucket bound
of the histogram: 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500 or 10000 ms), or both. `slos.windowDays`
(7 to 90, default 30) is the window the error budget covers.

```yaml
observability:
  slos:
    objectives:
      - service: orders
        availability: 99.9
        latency: { thresholdMs: 500, percent: 99 }
```

The plan gives each objective the four multi-window, multi-burn-rate alerts of the Google SRE workbook: it pages
(`critical`) when 2% of the budget goes in an hour (1h and 5m windows) or 5% in six hours (6h and 30m), and opens a
ticket (`warning`) when 10% goes in a day (1d and 2h) or in three days (3d and 6h). Over 30 days those are burn rates of
14.4, 6, 3 and 1; another window scales them, never below 1 (a slower burn never spends the budget, so a row that
would scale under 1 is held at 1). An objective of an unknown service, one listed twice or a threshold off the buckets
fails the plan.

`prometheusSloRules(plan)` renders them for the LGTM stack's ruler (Mimir or Prometheus): per objective one group with
a recording rule `slo:sli_error:ratio_rate<window>` per window and one `SloErrorBudgetBurn` alert per row, labelled
`slo_service`, `slo`, `severity`, `long_window` and `short_window` and linking the runbook
(`apps/docs/src/docs/runbooks/slo-burn-rate.mdx`), plus one `SloIndicatorMissing` warning that fires when the
objective's series has been absent for 15 minutes, so an objective with no data is never mistaken for a healthy one. The series names default to what Prometheus's OTLP receiver writes
(`http_server_request_duration_seconds`, the service in `job`); `metric`, `serviceLabel` and `runbookUrl` override them.
`JSON.stringify` of the result is a valid rule file.

```ts
import { observabilityPlan, prometheusSloRules } from "@stackra/infra-observability";

writeFileSync("slo-rules.yml", JSON.stringify(prometheusSloRules(plan), null, 2));
```

The rules need the series: every service with an objective must record `http.server.request.duration` in seconds with
the advised bounds (`HTTP_SERVER_DURATION` in `@stackra/contracts`). Stackra's server runtime does it for every call it
serves (`serveGuardedCall` in `@stackra/app/server`, which the generated adapter hands the bound `Metrics`) once the
service binds `OtlpMetricsDriver` and sets `logger.otlp.serviceName` to the service key the objective names.

`pnpm --filter @stackra/infra-observability test:int` runs `promtool test rules` of a real Prometheus over the rendered
rules (a fast burn pages, a slow burn opens a ticket, a healthy service stays quiet, a silent one raises
`SloIndicatorMissing`, and a broken threshold fails the test), and an end-to-end test: calls served through
`serveGuardedCall` with `OtlpMetricsDriver` reach a real OpenTelemetry Collector and Prometheus's OTLP receiver, and the
recorded ratios and the alerts that fire are checked. It runs the pinned images under Docker, or the same releases'
binaries when `STACKRA_OTELCOL_BIN` (otelcol-contrib 0.165.0) and `STACKRA_PROMETHEUS_DIR` (the unpacked Prometheus
3.15.1 release) name them.

## Core's own stack

`pulumi/` holds the Pulumi project that applies core's stack (STA-1573): `main.mjs` reads the root `runway.yaml` and
declares `observabilityStack` over the built package, today the uptime monitors of the registry, static and
turbo-cache Workers, the OTLP source and the unpublished status page. `.github/workflows/apply-observability.yml` runs
it behind the `observability` environment's reviewer once the repository variable `OBSERVABILITY_ENABLED` is `true`;
the runbook is `apps/docs/src/docs/runbooks/monitoring.mdx`. It stands in for the program `stackra infra gen` will
compose.

## Provider tokens

The owner sets each provider's token in the stack config of the private stacks repository: `sentry:token` (org and
project write), `logtail:apiToken` and `better-uptime:apiToken` (Better Stack), and the AWS credentials of the core
stack's account. Core's own stack decrypts its tokens from the sops scope `ci/deploy/observability` instead (ADR 0525) (see above). The
release job's `SENTRY_AUTH_TOKEN` uploads source maps and is a different token.

## Not here

- Sending a heartbeat: the scheduler, outbox and queue packages beat the URL they are given.
- The services' OTLP exporter and the redaction of personal data: `@stackra/logger` and `@stackra/errors`.
- Better Stack alerts for the objectives: the rules are Prometheus rules for the LGTM stack; a Better Stack-only
  product graphs the same recording expressions.
- The on-call rotation and severities (ADR 0185): the rotation names people.
- Agents run `pulumi preview` at most; `pulumi up` is the owner's (for core, the reviewer of `apply-observability.yml`).

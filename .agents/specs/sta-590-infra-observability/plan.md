# Plan: `@stackra/infra-observability`

**Spec**: `.agents/specs/sta-590-infra-observability/spec.md`

1. **Member files** copy `@stackra/runway`'s shape: `package.json` (entries `.` and `./node`, `#core` and `#node`
   imports), the `decorators` TypeScript and Vitest presets (the runway source reaches `@stackra/validation`), the
   tsdown entries, `stackra.config.ts` with `definePackage({})`, README, AGENTS, LICENSE and the CHANGELOG stub.
2. **The plan** (`src/core/`) is one pure function: the `observability` section through one strict zod schema with
   the ADR 0184 defaults (`prefault`, so nested defaults apply), then the environments, the heartbeat jobs, the Sentry
   projects and the indicators, recording every failure before it throws. The error reuses `@stackra/runway`'s
   `RunwayIssue`.
3. **The Pulumi programs** (`src/node/`): `logArchive` (internal) and `logPipeline` (Better Stack source through
   `pulumi-logtail`, archive through `@pulumi/aws`), `sentryProjects` (`@pulumiverse/sentry`), `heartbeatMonitors`
   (`pulumi-better-uptime`), and `observabilityStack`, which composes them and returns the outputs keyed like the
   runways' `ref:` paths. No component resource: the parts are plain functions, as in the other infra packages.
4. **Tests**: the plan over runway documents shaped like the template's (through `parseRunway`), and the programs
   under `runtime.setMocks`, answering the output-only properties the programs read.

## Constitution Check

| Law                                   | Result | Note                                                                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-observability`; workspace imports `@stackra/contracts` and `@stackra/runway` only  |
| Secrets (ADR 0173)                    | PASS   | the OTLP token and heartbeat URLs are secret outputs; the archive key lives in the encrypted state and Better Stack only        |
| Security                              | PASS   | the archive is private, encrypted and HTTPS only; its user reaches that bucket only; inputs are checked before anything deploys |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                    |
| Tenancy                               | N/A    | no tenant data; telemetry carries no personal data (ADR 0184 decision 5)                                                        |
| Delegation                            | PASS   | `package-builder` writes the code and the tests; a separate reviewer and the testing workflow run them                          |
| Not built yet (ADR 0227)              | PASS   | no separate observability service and no Prometheus for business metrics; OTLP to the platform backend                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                       |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the Pulumi packages go into the `infra` catalog                                              |
| Deploy modes (ADR 0076)               | PASS   | the SaaS core stack; on-premises installs use the bundled LGTM stack and do not run this program                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; free per ADR 0171 decision 5                                                                                |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                         |

## Deploy modes

| Mode       | Behaviour                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| SaaS       | read by `stackra infra gen` and run inside the generated Pulumi program of the core stack      |
| On-prem    | not run: telemetry goes to the bundled LGTM stack of the compose or Helm install (ADR 0184 d2) |
| Air-gapped | not run, as on-prem; the plan builder still reads local files only and makes no network call   |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node`; `.` exports `observabilityPlan`, `HeartbeatKind`, `SliKind` and `ObservabilityConfigInvalidError` and imports no Pulumi; `./node` exports `observabilityStack`, `logPipeline`, `sentryProjects` and `heartbeatMonitors` — Validates: FR-001
- **P-002**: the template's runways give the plan of User Story 1; omitted keys take the ADR 0184 values and a misspelt key fails — Validates: FR-002
- **P-003**: dev and preview get no heartbeat or alert; a switched-off kind gets no heartbeat; grace is a fifth of the period, rounded up — Validates: FR-003
- **P-004**: each service has exactly an availability and a latency indicator over `http.server.request.duration`, and the plan holds no objective — Validates: FR-004
- **P-005**: the source keeps the hot days and writes the archive it keeps after them; the archive expires after `ceil(months × 365.25 / 12)` days; its user's policy names that bucket only; no archive at 0 months — Validates: FR-005
- **P-006**: one team, one project and key per app, one issue alert per app and deployed environment — Validates: FR-006
- **P-007**: one heartbeat per planned heartbeat, its URL a secret output — Validates: FR-007
- **P-008**: the outputs are keyed like the `ref:` paths, the OTLP token and heartbeat URLs are secrets, and the program declares only the parts the plan holds — Validates: FR-008

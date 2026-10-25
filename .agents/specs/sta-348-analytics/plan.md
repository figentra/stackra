# Plan: `@stackra/analytics` wave 4

**Spec**: `.agents/specs/sta-348-analytics/spec.md`

## Design

- `AnalyticsDriver` port (`src/contracts/ports/`): one `send(deliveries)` that takes an ordered list of
  `AnalyticsDelivery` (`name`, `properties`, `occurredAt`). Exported from `./contracts`; a driver never checks consent.
- `AnalyticsOptions` (shape) registers `ANALYTICS_CONFIG_SCHEMA` (field rules only, every field defaulted, so gen can
  `.extend` it); `AnalyticsConfig` is `Config({ schema: AnalyticsOptions })`; the barrel exports the schema as
  `AnalyticsConfig$`. `AnalyticsDriverName` (`none` | `memory`) augments the `DriverRegistry`.
- `AnalyticsClient` (`src/core/services/`, `extends Service`) over the config, the driver and `ConsentLedger`:
  `track(event)` reads the event's kind and name with `kindOf`, re-parses its fields with `schemaOf` (only declared
  fields survive), removes `denyProperties`, stamps the capture time, then sends, queues (bounded, newest dropped) or
  drops by the category's status. It subscribes to the ledger only while events wait and settles the queue on the
  decision. `state` maps the consent status to `AnalyticsState`.
- `NoneAnalyticsDriver` (`src/core/drivers/`) is the default and sends nothing; `MemoryAnalyticsDriver`
  (`src/testing/drivers/`) keeps what it is sent.
- `useAnalytics` (`./react`) resolves the container's `AnalyticsClient`.
- `AnalyticsFake` (`./testing`) is a real client over the memory driver and its own in-memory ledger that records every
  tracked event; `fakeAnalytics()` returns a fresh one.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                              |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/cross-cutting/analytics`; workspace imports: `@stackra/config`, `@stackra/consent`, `@stackra/container`, `@stackra/contracts`, `@stackra/events`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                               |
| Security                              | PASS   | nothing leaves before consent; Global Privacy Control refuses; only schema-declared fields leave; the ingest origin is an http(s) URL or empty                                                                                                    |
| HTTP and events                       | N/A    | no action, endpoint or integration event; `AnalyticsEvent` stays in `@stackra/events`                                                                                                                                                             |
| Tenancy                               | N/A    | no tenant data and no tenant vocabulary (R-59)                                                                                                                                                                                                    |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                            |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                                  |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                         |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                                |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                           |

- Boundaries: imports the six workspace packages above, `zod` and React only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; one declaration per file.
- Secrets and PII: none stored; payloads are schema-declared fields minus the deny list, held in memory until sent.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app                        |
| On-prem    | identical: the same build; runway selects the `none` driver, so nothing sent |
| Air-gapped | identical: needs no network at build or run with the `none` driver           |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing`, and `src/contracts/` imports no other entry — Validates: FR-001
- **P-002**: `.` exports `AnalyticsClient`, `AnalyticsConfig`, `AnalyticsConfig$`, `AnalyticsOptions`, `AnalyticsState`, `NoneAnalyticsDriver` and the type `AnalyticsDriverName`, and nothing else — Validates: FR-002
- **P-003**: `./contracts` exports `AnalyticsDriver` and `AnalyticsDelivery`, `./react` exports `useAnalytics`, and `./testing` exports `fakeAnalytics`, `AnalyticsFake` and `MemoryAnalyticsDriver` — Validates: FR-003
- **P-004**: no delivery reaches the driver while the category is undecided or refused; on acceptance the waiting deliveries arrive first and in capture order; the queue never exceeds `queueLimit`; Global Privacy Control reads as refused — Validates: FR-004
- **P-005**: every delivery's `properties` is a subset of the event schema's output with no key from `denyProperties`, and a non-analytics event throws before anything is queued — Validates: FR-005
- **P-006**: `AnalyticsConfig$.parse({})` selects `none`, and `consentCategory: "necessary"` fails to parse — Validates: FR-006

# Threat model: @stackra/actions

<!--
Stackra file contract:
Purpose: the threat model of @stackra/actions: the fixed action pipeline (tenancy, permission, step-up, preconditions,
         entitlement, flag, validation, approval, idempotency, rate limit, interceptors, cache, handle, audit), call
         options and the idempotency, rate-limit and cache stores behind its ports.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC1, SEC2, SEC3, SEC9 and SEC10; ADR 0098; ADR 0136; ADR 0138; ADR 0217; ADR 0397;
                    ADR 0406; ADR 0495; ADR 0207 (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L2 for V4 (access control); L1 for every other chapter, with V11 (business logic) its own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Every call a user, service, agent or job makes runs through `ActionPipeline` in one fixed order that an app can
configure but never reorder. This package owns that order and the stores behind idempotency, rate limits and the
query cache; IAM, tenancy and the others implement its ports. Its threats are a call that skips a gate, a write that
runs twice, and a store that leaks one caller's answer to another.

## Assets

| Asset                                           | Where it lives                                                                | Class          |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | -------------- |
| Idempotency records (input fingerprint, output) | `IdempotencyStore`, 24 hours by default, never `@ShownOnce` fields            | `confidential` |
| Rate-limit buckets                              | `RateLimitStore`, keyed by area, app, scope, action and hashed client address | `internal`     |
| Cached query answers                            | the `Cache` port, a key per caller unless `per` widens it                     | `confidential` |
| Audit entries a handler adds                    | `ctx.audit(...)` through the `AuditTrail` port                                | `confidential` |
| The client address of a call                    | `ctx.client`, held for the call only                                          | `pii`          |

## Trust boundaries

1. The transport (`serveGuardedCall` of `@stackra/app`, the queue worker, the outbox relay, the MCP gateway) to the
   pipeline, with a verified actor and call options.
2. The pipeline to its ports: `AccessControl`, `CallIsolation`, `StepUpCheck`, `EntitlementCheck`, `ApprovalGate`,
   the stores and `AuditTrail`.
3. The handler's own work inside the call's unit of work.

## Threats and controls

| Threat                                                         | Control today                                                                                                                               | Open work                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| An app reorders or skips a gate                                | The order is fixed in code (ADR 0138); an app configures steps, never their order                                                           | —                                                       |
| A call runs with no permission check because a port is unbound | Permission fails closed when no `AccessControl` is bound; `approval: true` and `stepUp` fail closed without their port                      | —                                                       |
| A write goes unaudited                                         | The success entry is written in the action's unit of work and a refusal's after the rollback, when an `AuditTrail` is bound                 | Audit trail required outside dev and test, STA-1571     |
| A retried write runs twice                                     | Idempotency keys with a SHA-256 fingerprint of the input; a different input under the same key is refused                                   | Completion committed with the action, STA-2797          |
| Idempotency or rate limits lost across instances or restarts   | None in deployed environments: both stores default to `memory`                                                                              | Refuse memory stores in deployed environments, STA-2798 |
| A secret output is replayed to whoever repeats the key         | `@ShownOnce` output fields are never kept in the idempotency store                                                                          | —                                                       |
| A signed-in visitor's credential leaks into a public action    | `credentials: "ignore"` runs the call as a fresh anonymous actor and drops scope, assurance and device                                      | —                                                       |
| A sign-up runs as an already signed-in user                    | An action whose actors are exactly `[ActorKind.Anonymous]` refuses a signed-in caller                                                       | —                                                       |
| Abuse floods one action or one tenant                          | Area buckets per app and scope, a default bucket per action and scope (1200/min) and per client address (300/min); scope caps from settings | —                                                       |
| One caller reads another's cached answer                       | The query cache key is per caller unless the query's `per` widens it on purpose                                                             | —                                                       |
| A long transaction holds locks and starves others              | An action's `timeout` bounds each statement of its transaction                                                                              | Load shedding and circuit breakers, STA-1467            |
| Staged gen refusals let an unsafe action ship                  | Gen warns on missing idempotency, step-up, tenancy and wrong risk levels                                                                    | Make them blocking, STA-2808                            |

# Threat model: @stackra/iam

<!--
Stackra file contract:
Purpose: the threat model of @stackra/iam: the embedded policy decision point, permissions and their risk, roles,
         record policies, visibility in reads, field access, restricted permissions and break-glass grants.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC2 and SEC10; ADR 0208; ADR 0209; ADR 0132; ADR 0333; ADR 0407; ADR 0462; ADR 0207
                    (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L2 for V4 (access control); L1 for every other chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

IAM answers who may do what, where and on which records, in process, from the principal's policy snapshot. It is the
permission step of every action and the visibility filter of every read. Its threats are a wrong "allow": privilege
escalation, a missed record rule, or a field shown that should be hidden.

## Assets

| Asset                                        | Where it lives                                                     | Class          |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Policy snapshots (grants, roles, deny rules) | `PolicySnapshotStore` (Postgres, one row per tenant and principal) | `confidential` |
| Break-glass grants                           | the snapshot (`BreakGlassGrant`), each with a reason and a window  | `confidential` |
| Record facts read for a decision             | memory, for one evaluation only                                    | `pii`          |
| The client's permission keys                 | `PermissionSnapshotService` (presentation only)                    | `internal`     |

## Trust boundaries

1. The action pipeline to the decision point, with the verified actor chain and the call's scope.
2. The IAM service's snapshot events to `PolicySnapshotIntakeService` and the store.
3. The decision point to Postgres reads, through `IamVisibilityFilterDriver` and bound query parameters.
4. The client: it may hide what a user cannot do, and never decides (SEC2).

## Threats and controls

| Threat                                                           | Control today                                                                                                                                          | Open work                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| A call with no matching grant is allowed                         | Deny by default; the pipeline's permission step fails closed when no `AccessControl` is bound                                                          | —                                                                                    |
| A broad grant reaches a dangerous permission                     | Wildcards count only in system roles; `@read` and `@risk:*` selectors never pick a system or restricted permission; an explicit deny beats every grant | —                                                                                    |
| A user grants themselves a restricted permission                 | `Permission.L3.restricted()` counts only when `grantedBy` is someone else; `canDelegate(..., { to: self })` refuses it                                 | —                                                                                    |
| A service or agent escalates through the user it acts for        | Every link of the actor chain must hold the permission (ADR 0462)                                                                                      | —                                                                                    |
| A record outside the caller's reach is read or changed           | Record policies (any deny wins), `ctx.authorize(record)`, visibility rules pushed into reads; a cross-tenant miss is "not found"                       | Gen's step-up and risk refusals made blocking, STA-2808                              |
| A hidden field leaks through a view, export, filter or aggregate | `redactFields`, `assertFieldsReadable` refuses aggregates over or filters on hidden fields; `hiddenColumns` for views, reports and exports             | —                                                                                    |
| An emergency grant outlives the emergency                        | `breakGlassGrant` needs a reason, a window and a longest duration; it crosses only denies marked `breakable` and its explanation says `break_glass`    | The break-glass read log (not built; ADR 0333)                                       |
| A stale snapshot keeps a revoked grant alive                     | Grants expire on their own; snapshots are replaced by the IAM service's events per principal                                                           | Cache keyed by grants version across services (constitution, "Effective permission") |
| SQL injection through a rule value                               | Rule values are bound as query parameters by `whereOf`; never written into SQL or logged                                                               | —                                                                                    |
| The client's permission list is trusted                          | Presentation only: the producer checks every call                                                                                                      | —                                                                                    |

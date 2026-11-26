# Threat model: @stackra/entitlements

<!--
Stackra file contract:
Purpose: the threat model of @stackra/entitlements: plan rights (features, limits, quotas, seats), the pipeline's
         entitlement step, limit reservation and the plan-sized rate-limit budget.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC5 and SEC10; ADR 0215; ADR 0216; ADR 0217; ADR 0408; ADR 0207 (amendment of
                    2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V11 (business logic) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

An entitlement is a commercial right, not a permission: it gates calls by what the customer's plan grants. The
threats are using more than the plan allows, and a plan source that answers wrongly or not at all.

## Assets

| Asset                             | Where it lives                                                       | Class          |
| --------------------------------- | -------------------------------------------------------------------- | -------------- |
| Plan snapshots (grants per scope) | `PlanSnapshots`, fed by the plan service or the on-prem licence      | `confidential` |
| Usage counts and meter totals     | `EntitlementUsage`, `MeterTotals` (the data layer and usage service) | `internal`     |
| Seat assignments                  | `SeatLedger`                                                         | `internal`     |
| Plan catalogue versions           | `CatalogueVersions`, two-approver changes                            | `internal`     |

## Trust boundaries

1. The action pipeline to the entitlement step, with the call's verified scope.
2. This package to the plan service (SaaS) or to the verified licence (on-prem, `@stackra/licensing`).
3. This package to the usage and meter stores that count what a scope holds.

## Threats and controls

| Threat                                      | Control today                                                                                                       | Open work                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A caller claims another scope's plan        | The step reads the scope of the verified call, never input                                                          | —                                                             |
| Two creates race past a limit               | `LimitReservationService` reserves under the limit's lock, then commits with the write                              | —                                                             |
| A quota-gated call runs unmetered           | A quota-gated call with no `MeterTotals` bound throws instead of passing                                            | One call may overshoot by its own units (ADR 0216 question 1) |
| A plan source outage grants everything      | A missing or `false` grant refuses `EntitlementRequiredError`; a grant of the wrong shape throws instead of passing | —                                                             |
| A lower plan floods the API                 | `EntitlementRateLimitBudgetDriver` sizes the area bucket from the plan's `rate_limit.*` values                      | Shared rate-limit stores in deployed environments, STA-2798   |
| One person changes the plan catalogue alone | Catalogue changes need a second approver (`SecondApproverRequiredError`) and cannot be backdated                    | —                                                             |
| A refusal leaks another customer's limits   | `LimitReachedError` details carry the entitlement key and the caller's own allowance only                           | —                                                             |

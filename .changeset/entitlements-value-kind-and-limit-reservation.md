---
"@stackra/entitlements": minor
---

Add the numeric value kind `EntitlementKind.Value` and `EntitlementValueService.valueOf` to read it from the effective
plan (STA-824), and `PlanLimitReservationDriver`, the pipeline's `LimitReservation` over `LimitReservationService`, so
every create a limit gates is reserved around its unit of work (STA-765, ADR 0408).

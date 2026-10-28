---
"@stackra/entitlements": minor
---

Consumption quotas from meters (stackra-309, ADR 0216 decision 3). A new `EntitlementKind.Quota` names the meter an
action feeds and a `QuotaPeriod` (day, month, year). `PlanEntitlementCheckDriver` reads the meter's total for the
current UTC period through the new `MeterTotals` port and refuses `quota_exceeded` (`QuotaExceededError`, with the
key, meter, allowance and `resetsAt`) once the plan's allowance is used; a soft quota in its grace period passes and
tells the optional `QuotaWarnings` port. `quotaWindow` gives a period's window.

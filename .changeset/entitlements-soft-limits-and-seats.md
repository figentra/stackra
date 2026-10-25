---
"@stackra/entitlements": minor
---

Soft limits with grace (`LimitGrant`, `limitAllows`) in the plan driver; `EntitlementSource` moves to `./contracts`
(still re-exported from `.`) with `PlanSnapshotEntitlementSourceDriver` over the new `PlanSnapshots` port;
reserve-then-commit at a limit (`LimitReservationService`, on `@stackra/locking`); and the seat-kind meter
(`SeatMeterService`, the `SeatLedger` port, `SeatLimitReachedError`), with memory drivers.

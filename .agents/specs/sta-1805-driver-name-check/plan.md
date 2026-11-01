# Implementation Plan: a shape's `$Check` leaves out its driver-name fields

**Spec**: `spec.md` · **Linear**: STA-1805 · **Branch**: `figentra/sta-1805-port-key-brand`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                              | Gate          |
| ---- | ----------------------------------------------------------------- | ------------- |
| 1    | `shapeOf` omits `driver_name` fields from both sides of the check | gen tests     |
| 2    | The emit-schemas test on the commerce options shape               | gen tests     |
| 3    | billing-service-entitlements re-runs gen and typecheck            | product gates |

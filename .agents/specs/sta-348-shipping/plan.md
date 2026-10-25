# Plan: `@stackra/shipping`

**Spec**: `.agents/specs/sta-348-shipping/spec.md` · **ADR**: 0369

## Design

- Entries through stand-in barrels: `./contracts` (enums `CarrierCapability`, `TrackingState`, `LabelFormat`; port
  `CarrierGateways`; the gateway interfaces and request and result types), `.` (`hasCapability`, `normaliseTracking`,
  `labelDocument`, `batchZpl`, `dimensionalWeight`, `chargeableWeight`, `NoCarrierError`, `LabelDocumentInvalidError`).
  No `./node`, no `./testing`.
- Gateways follow `@stackra/payments`: an interface on the Connection plus a capability map and `hasCapability`.
- Tracking: map by own key (`Object.hasOwn`), dedupe on code and parsed instant, stable sort by instant.
- Labels: base64 through `atob`, envelope checks on bytes; ZPL batch by concatenation with a line break.
- Weight: integers in mm and g; `grams = ceil(mm³ / factor)`.

## Constitution Check

| Law                       | Result | Note                                                     |
| ------------------------- | ------ | -------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | `tier:lib`; imports contracts, errors and money only     |
| Secrets                   | N/A    | none                                                     |
| Tenancy                   | N/A    | no table                                                 |
| Configuration over code   | PASS   | carriers, factors, increments, maps and stock are inputs |
| Versions and catalogs     | PASS   | `catalog:` and `workspace:*`                             |
| Test placement (ADR 0022) | PASS   | `src/**/__tests__/`                                      |
| Third-party sources       | N/A    | first-party code                                         |

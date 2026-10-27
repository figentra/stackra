---
"@stackra/shipping": minor
---

<!-- Stackra file contract: Purpose: release note for stackra-55 (STA-928). Boundary: changeset only. Runtime: none.
Governing contract: ADR 0369; R3-SO-09. -->

Add pickup point and locker search (`CarrierCapability.PickupPoints`, `PickupPointGateway`, `PickupPointSearch`,
`PickupPoint`, `PickupPointKind`; `LabelRequest.pickupPointId`), the provisional return label shape
(`CarrierCapability.Returns`, `ReturnLabelGateway`, `ReturnLabelRequest`), the `DistanceMatrix` and `RouteSolver`
routing ports with `MemoryDistanceMatrixDriver` and `MemoryRouteSolverDriver`, and the `./testing` entry with
`CarrierGatewaysFake` (optional peer `@stackra/testing`). STA-745, STA-747.

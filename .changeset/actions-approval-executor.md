---
"@stackra/actions": minor
---

Add the approval executor (STA-1724, ADR 0509). `ApprovalGranted` (`actions.approval.granted.v1`, ids only) and the
`ApprovalGrantOrigin` port are in `@stackra/actions/contracts`; `ApprovalExecutorListener` is in `@stackra/actions/node`. On a
grant from the store's service it reads the owning service's binding in a read-only isolation run as the tenant's system
actor, checks `ScopeOwnership` and the snapshot hash, moves the request `granted → executing` by compare-and-set, and runs
the pipeline as the stored requester under the key `approval:<id>` in a fresh run. A refusal settles `failed`; an
in-flight answer, an identity outage or another error leaves the request `executing` for a retry; a request still
`executing` 24 hours after its grant settles `unknown`. `ApprovalOutcome` gains `{ status: "unknown" }`, and
`MemoryApprovalGateDriver` and the gate conformance suite follow; the driver is built with `MemoryApprovalGateDriver.of(options)` (STA-1884).

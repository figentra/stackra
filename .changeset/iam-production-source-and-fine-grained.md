---
"@stackra/iam": minor
---

Add the production `StorePolicySourceDriver` over the new `PolicySnapshotStore` port (with
`MemoryPolicySnapshotStoreDriver` and `decodePolicySnapshot` for event payloads); field-level rules (`FieldRule`,
`FieldAccess`, `pdp.fieldAccess`, `redactFields`, `assertFieldsWritable`); conditions on dimensions another service owns
(`registerDimensions`, the `DimensionValues` port, fail closed); time-boxed break-glass (`BreakGlassGrant`,
`breakGlassGrant`, `AccessReason.BreakGlass`, `DenyRule.breakable`); existence-only hits (`Capability.Exists`,
`existenceHit`); and restricted permissions that are never self-granted (`Permission.Lx.restricted()`,
`Grant.grantedBy`, `canDelegate(..., { to })`).

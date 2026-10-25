---
"@stackra/contracts": minor
---

Add `@stackra/contracts`, the leaf vocabulary every Stackra package builds on: the `Port` and `Enum` kind bases
(`Enum.of`, `Enum.values`, `Enum.meta`, `Enum.Value`), `Duration` as canonical ISO 8601 strings, the enums `ActorKind`,
`ApiArea`, `DataClassification`, `HttpMethod`, `MigrationRunner`, `Realm`, `SortDirection`, `Target` and the one `Tone`
with ADR 0303's five values, the ports `Clock`, `Logger` and `IdentityResolver`, the types `Actor`, `PublicId`,
`Branded`, `Email`, `Url`, `Json`, `VerifiedPrincipal` and `StackraManifest`, `brand()`, and the four
`stackra.config.ts` helpers `defineApp`, `defineService`, `definePackage` and `defineWorker`. No workspace dependency.

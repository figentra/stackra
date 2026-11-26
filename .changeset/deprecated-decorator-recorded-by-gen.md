---
"@stackra/contracts": minor
"@stackra/validation": minor
"@stackra/gen": minor
---

**`@Deprecated` marks what is going away, and gen records it and warns where it is used** (ADR 0131 decision 4,
STA-2836).

- `@stackra/validation` exports `@Deprecated({ since, sunset, replacement })` for a class (an action, query, event,
  settings group, service or any kind whose identity the manifest locks) or a field of a shape (a schema, an event, a
  setting). It records only, and throws on import when the terms are malformed or the sunset is inside the window. A
  model trait takes the same terms as `createTrait`'s `deprecated` option.
- `@stackra/contracts` exports the window: `earliestSunset(since)` (the next minor before 1.0, the next major after,
  six months for a date version), `deprecationProblem(value)` and `sunsetReached(sunset, now)`, with the `Deprecation`
  and `DeprecationProblem` types. `StackraManifest` gains the optional `deprecations` section.
- `stackra gen` records each deprecation in `stackra.manifest.json` (`deprecations`, plus `deprecated` on the action's
  and event's entry and `deprecated: true` on the field's JSON Schema), marks the operation `deprecated` in
  `openapi.json`, and writes a `@deprecated` line on the descriptor, client member and event class of each consumer's
  generated client. It warns `deprecated_use` where a member injects, listens to, extends or composes something
  deprecated (its own, a dependency's or a consumed service's), and `deprecation_past_sunset` when the member's version
  reaches its own sunset. It refuses `deprecation_invalid`, `deprecation_window_short` and `deprecation_not_constant`.

Nothing changes for a member that deprecates nothing: its manifest gets no new section. The policy is on the docs
page Deprecation policy (`customers/deprecation`).

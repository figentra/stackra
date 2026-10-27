---
"@stackra/gen": minor
---

Gen merges the `assets/lang` of every service a member consumes through a client into `I18n` (loaders import the
service's files relative to the member), so an app's `I18n.orders.*` resolves. `remoteShape` of `@stackra/clients` is
a schema kind base: `PickType`/`OmitType`/`PartialType` of a remote shape and a form that extends one compile against
the client class's `schema` static (`ShapeIR.base` kind `remote`). `Settings.pick([...])` of `#stackra/settings` is a
schema kind, so it is no longer `kind_unregistered_base`. A default naming a missing enum case is
`shape_default_member_unresolved` instead of `shape_default_not_constant` (STA-1363).

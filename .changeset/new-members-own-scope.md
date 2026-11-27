---
"@stackra/cli": minor
---

`stackra new` names a created app's members in the app's own npm scope, not in `@figentra` (STA-2890). `stackra
create` now stores the scope it asks for as the root package.json `stackra.scope`, and `memberNaming` reads it before
the root runway's `product.key`, so `stackra new service orders` in an app made with `--scope @acme` writes
`@acme/service-orders` (and `stackra new package kit` writes `@acme/kit`) instead of `@figentra/<key>-service-orders`,
a scope the user does not own and that the app's `.npmrc` maps to Figentra's registry. Without `stackra.scope`, the
scope of the root package's own name counts when it is not a first-party scope (`@stackra`, `@stackra-pro`,
`@figentra`). `--scope` still wins, and a Figentra product repository (no `stackra.scope`, an unscoped or `@figentra`
root package) keeps the ADR 0349 names. A `stackra.scope` that is not an npm scope is refused. An app created before
this release keeps naming members in `@figentra` until `"stackra": { "scope": "@acme" }` is added to its root
package.json.

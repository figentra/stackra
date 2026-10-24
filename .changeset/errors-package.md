---
"@stackra/errors": minor
---

Add `@stackra/errors`, refusals and the error envelope of the programming model v3.1: the called-only kind base
`Refusal({ kind, retryable })` whose fields are typed details (`X.create({...})`, `X.envelope({...})`), the code
derived from the class name by `refusalCode` (the function gen shares), `ErrorKind` with the ten kinds of ADR 0140 and
their category, HTTP status and default retry flag, the ADR 0140 envelope (`toEnvelope()`), `isRefusal` by brand
across bundles, the core refusals (`ForbiddenError`, `NotFoundError`, `UnauthenticatedError`,
`EntitlementRequiredError`, `RateLimitedError`, `IdempotencyKeyReusedError`, `WorkflowTimedOutError`,
`BridgeRejectedError`) also keyed by code in `CoreRefusals`; `./contracts` with the `ErrorReporter` port; `./react` with
`useErrorReporter`; and `./testing` with `refusal(X, details?)` and the `toRefuseWith` matcher.

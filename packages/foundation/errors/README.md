# @stackra/errors

Stackra refusals: the errors a member raises on purpose, each with a kind, a code derived from its class name and
typed details, carried on every transport as the one error envelope of ADR 0140.

**Tier:** `tier:lib` (`packages/foundation/errors`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/contracts` and `@stackra/container`; React is an optional peer of `./react`, `@stackra/testing` of
`./testing`.

## What is here

| Entry         | Symbol                                                                            | Use                                                          |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `.`           | `Refusal`                                                                         | `extends Refusal({ kind, retryable })`, called only          |
| `.`           | `ErrorKind`                                                                       | the ten kinds; `Enum.meta` gives category and HTTP status    |
| `.`           | `isRefusal`                                                                       | `isRefusal(error)`, `isRefusal(error, ProductNotFoundError)` |
| `.`           | `ForbiddenError`, `NotFoundError`, `UnauthenticatedError`, ... and `CoreRefusals` | the refusals the platform raises, also keyed by code         |
| `.`           | `refusalCode`                                                                     | the class-name-to-code derivation gen shares                 |
| `.`           | `rateLimitHeaders`                                                                | `Retry-After` and `RateLimit-*` of a `RateLimitedError`      |
| `.`           | `ErrorEnvelope`, `ErrorCategory`, `FieldErrors`, `RefusalClass`, ...              | types                                                        |
| `./contracts` | `ErrorReporter`                                                                   | the port unexpected errors go to                             |
| `./react`     | `useErrorReporter`                                                                | `report = useErrorReporter()` in a component                 |
| `./testing`   | `refusal`, `toRefuseWith`                                                         | `rejects.toRefuseWith(refusal(X, details?))`                 |

## Declaring and raising a refusal

```ts
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: waiting never changes an order that is already paid. */
export class OrderNotPayableError extends Refusal({ kind: ErrorKind.Conflict, retryable: false }) {
  orderId!: PublicId<"ord">;
  status!: OrderStatus;
}

throw OrderNotPayableError.create({ orderId, status }); // code "order_not_payable", HTTP 409
```

The file is `order-not-payable.error.ts` in the module's `errors/` group. The class name must end in `Error`; the code
is `snake(class minus "Error")`. `create` requires exactly the declared fields; a second argument takes
`{ fieldErrors, cause }`. `toEnvelope()` gives `{ code, category, retryable, details?, fieldErrors? }`.

## Testing

```ts
import { refusal } from "@stackra/errors/testing";

await expect(loyalty.assertCanRedeem(member, 101)).rejects.toRefuseWith(
  refusal(InsufficientPointsError),
);
expect(result).toRefuseWith(refusal(NotOwnPrincipalError)); // a `{ ok: false, error }` result
```

`toRefuseWith` compares the code, the details the expected refusal sets and its field errors (`refusal(X, { fields })`),
never message text.

Governing ADRs: 0140 (envelope and kinds), 0232 (this package), 0294 (decisions 16, 20, 25), 0305 (rule 2), 0269.

## Sentry and live configuration

- `MemoryErrorReporterDriver` (driver name `memory`) keeps each reported error in `errors` for a test (STA-1308).
- `SentryErrorReporterDriver` (driver name `sentry`) is an `ErrorReporter` with no vendor SDK: each error becomes one
  Sentry envelope POSTed with `fetch` to the project of the DSN secret (`SentryConfig.dsnSecret`, `SENTRY_DSN` by
  default), tagged with the environment, the release and a refusal's code, sampled by `sampleRate`. It sends no
  request, user or input. Call `flush()` before a process ends.
- `SentryConfig` is the one Sentry source (ADR 0465): the DSN (by secret name) and the share of errors reported live
  here only. `@stackra/logger`'s `TelemetryConfig` keeps the client switches Sentry's config has no field for
  (`errors.enabled`, `errors.nativeCrashes`, trace and replay sampling, vitals) and a client reporter reads the DSN and
  `sampleRate` from `SentryConfig`. Before stackra-226 both held a DSN and an error rate.
- `LiveReadOnlyError` (`live_read_only`, 409) is the refusal of a structural-configuration write in live (ADR 0359
  decision 3); the action pipeline raises it through its `LiveConfigurationGuard`.

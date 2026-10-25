# AGENTS — @stackra/integrations

Provider integrations, connections and their store (ADR 0308). Member at `packages/communication/integrations`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and `./testing`.

## Where code goes

| You are writing…         | It goes in…                                 |
| ------------------------ | ------------------------------------------- |
| A kind base              | `src/core/bases/<name>.base.ts`             |
| A port with leaf types   | `src/contracts/ports/<name>.port.ts`        |
| A port that uses `.`     | `src/core/ports/<name>.port.ts`             |
| A store driver           | `src/core/drivers/<name>.driver.ts`         |
| The runtime service      | `src/core/services/<name>.service.ts`       |
| A function               | `src/core/functions/<name>.function.ts`     |
| A refusal                | `src/core/errors/<name>.error.ts`           |
| A value class            | `src/core/values/<name>.value.ts`           |
| A type                   | `src/core/types/<name>.type.ts`             |
| A fake or testing helper | `src/testing/<group>/<name>.<kind>.ts`      |
| A test                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts`, `src/contracts/index.ts` and `src/testing/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to the barrel and to its `__tests__/index.test.ts`.
- `managedClient`, the placeholder lookup, the token calls, the JWT signer and the registries stay internal. `./testing`
  imports `.`, `./contracts` and `@stackra/container/testing` only (ADR 0269 decision 3). `./contracts` is the leaf: it
  imports `@stackra/contracts` only.

## This package

- A secret is a name (`@Secret("RESEND_API_KEY")`), never a value. An Integration's `@Secret` fields stay unset on the
  instance: the managed client reads them blind from the `SecretStore` at call time. A connection's secret fields are
  non-enumerable, so they never spread, serialise or log.
- No credential, token or response body goes into an error, a rate-limit key or a log. A provider code enters a refusal
  only when it is a short machine code.
- No tenant vocabulary (R-59): a connection is owned by a user or by a scope node (`ScopeRef`, matched by its path), and
  the scope tree's levels are deployment data (ADR 0327).
- `Connection` does not declare `subscribe()` or `unsubscribe()`; a class adds them as its own methods and may say so
  with `implements ConnectionWebhooks`.
- No parameter properties and no `#private` fields; the source keeps to erasable syntax.

## PII

| Data                    | Where                                      | Handling                                                                                       |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Connection credentials  | connection `@Secret` fields, store records | In memory (local) or encrypted by the store host (hosted); never enumerable, logged or echoed. |
| OAuth tokens            | `IntegrationRuntime`, `ConnectionHost`     | In memory per credential; in hosted mode refresh tokens never leave the store host.            |
| Provider answers        | managed client                             | Returned to the caller only; never stored or logged here.                                      |
| Connected account label | `ConnectedAccount`, store records          | The provider's account id and name or domain, shown to the owner in the console.               |

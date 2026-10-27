# @stackra/transport

<!--
Stackra file contract:
Purpose: the package's reader guide: the transport pipeline, its middleware (retry, timeout, idempotency, version) and the stream readers.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0118; ADR 0138; ADR 0140; ADR 0260; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

The HTTP client pipeline under Stackra's generated clients: standard `Request` in, standard `Response` out, through
middleware for the bearer token, retries, timeouts, the `Idempotency-Key` and the `Stackra-Version` header, plus
readers for NDJSON and server-sent-event bodies.

**Tier:** `tier:lib` (`packages/foundation/transport`). Entries `.` and `./native`. Depends on `@stackra/contracts`
and `@stackra/errors`; `expo` is an optional peer of `./native`. Members rarely import it themselves:
`@stackra/clients` builds the transport for every generated client.

## What is here

| Entry      | Symbol                                         | Use                                                              |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `.`        | `createTransport`                              | folds the middleware, outermost first, over the terminal fetch   |
| `.`        | `stackraVersion`                               | pins `Stackra-Version` to a date                                 |
| `.`        | `bearerToken`                                  | `Authorization: Bearer <token>` from a source asked per request  |
| `.`        | `idempotencyKey`                               | one `Idempotency-Key` per write, kept across retries             |
| `.`        | `retry`                                        | repeats what is safe to repeat after a failure, a 429 or a 503   |
| `.`        | `timeout`                                      | aborts when no response arrives in time (`RequestTimedOutError`) |
| `.`        | `readNdjson`, `readServerSentEvents`           | stream readers                                                   |
| `.`        | `RequestTimedOutError`, `TRANSPORT_HEADERS`    | the timeout refusal and the header names                         |
| `.`        | `Transport`, `Middleware`, `RetryOptions`, ... | types                                                            |
| `./native` | `nativeFetch`                                  | the terminal fetch on Expo, whose body streams                   |

## Building a transport

```ts
import { Duration } from "@stackra/contracts";
import {
  bearerToken,
  createTransport,
  idempotencyKey,
  retry,
  stackraVersion,
  timeout,
} from "@stackra/transport";

const send = createTransport({
  middleware: [
    stackraVersion("2027-03-01"),
    bearerToken(() => session.accessToken),
    idempotencyKey(), // outside retry: every attempt carries the same key
    retry({ attempts: 3 }),
    timeout(Duration.seconds(30)), // inside retry: every attempt gets the full time
  ],
});

const response = await send(new Request(`${apiUrl}/orders`, { method: "POST", body }));
```

`retry` never repeats a `POST` or `PATCH` without an `Idempotency-Key`. It retries a fetch failure, a
`RequestTimedOutError`, and the statuses of the retryable `ErrorKind`s (429, 503), honouring `Retry-After` up to
`maxWait` and an envelope that says `retryable: false`. Its options are the contracts `RetryPolicy` plus `maxWait`:
`base` 200 ms doubling, `max` 5 s when left out, and `retryOn: RetryOn.Network` retries no refusal (it replaced the
`network`, `refused` and `delay` options in stackra-223).

On Expo, pass `fetch: nativeFetch` from `@stackra/transport/native`; React Native's own fetch buffers the whole body.

## Streams

```ts
for await (const value of readNdjson(response)) rows.push(OrderRow.parse(value)); // values are unknown: parse them
for await (const { event, data } of readServerSentEvents(response))
  if (event === "delta") append(data);
```

Stopping a loop early cancels the body. `timeout` times the wait for the response headers, so it never cuts a stream
that has started.

Governing ADRs: 0118 (`Stackra-Version`), 0138 (idempotency), 0140 (kinds and statuses), 0260 (clients), 0294
(decision 15), 0127 (2026-10-24 note).

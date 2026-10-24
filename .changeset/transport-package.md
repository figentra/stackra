---
"@stackra/transport": minor
---

Add `@stackra/transport`, the HTTP client pipeline under the generated clients: `createTransport` folds middleware over
the platform's `fetch` with standard `Request` and `Response`; `stackraVersion` pins the dated `Stackra-Version`
header; `bearerToken` sends the access token from a source asked per request; `idempotencyKey` gives every write one
`Idempotency-Key` kept across retries; `retry` repeats only what is safe to repeat, after a network failure, a
`RequestTimedOutError` or a status of a retryable `ErrorKind`, honouring `Retry-After` and `retryable: false`;
`timeout` aborts a request whose response does not arrive in time; `readNdjson` and `readServerSentEvents` read
streamed bodies and cancel them when the consumer stops; `TRANSPORT_HEADERS` names the headers; and `./native` adds
`nativeFetch`, the streaming terminal fetch on Expo.

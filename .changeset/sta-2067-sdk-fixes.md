---
"@stackra/gen": patch
---

The generated public SDKs: the TypeScript client now requests the base URL plus the endpoint path, so a base URL with a
path prefix (`https://example.com/api`) keeps it, as the Python and PHP clients already did; a host-only base URL
requests the same URL as before. Every write in the TypeScript, Python and PHP clients now sends an `Idempotency-Key`:
the caller's when passed, else a UUID v4 generated once per call before the request (`crypto.randomUUID()`,
`uuid.uuid4()`, `random_bytes`), so a retry around the request replays one call. A `GET` sends none. A TypeScript
runtime without Web Crypto passes `idempotencyKey` on writes.

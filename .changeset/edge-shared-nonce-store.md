---
"@stackra/cache": minor
"@stackra/app": minor
---

A signed edge request can no longer be replayed against another API instance of the same region. `Cache.add(key,
value, ttl)` is an atomic set-if-absent that answers whether it stored: one `SET … PX … NX` on Valkey, an upsert that
replaces only a dead row on Postgres, one check-and-set in memory; the `storage` and `workers` drivers have none and
reject it, as does the port's default for any other driver. `EdgeNonceStore` gains the `cache` driver, which claims
each request id with `Cache.add`, so every instance sharing a `valkey` or `postgres` cache refuses a replay; a region
with more than one API instance sets `app.edge.nonces: cache`. `EdgeSigningKeys` gains the `secrets` driver, which
reads the signing keys from the bound `SecretStore` on every check (the secret `app.edge.signingKeysSecret` names,
`STACKRA_EDGE_SIGNING_KEYS` by default), so a key rotation the store reloads is accepted without a restart. `memory`
stays the default for both ports (ADR 0437, STA-2803).

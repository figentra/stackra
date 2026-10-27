---
"@stackra/contracts": minor
"@stackra/actions": patch
"@stackra/outbox": patch
"@stackra/model": patch
---

One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
`@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
outbox's `evt_` check and the inbox's claim compare ids as strings.

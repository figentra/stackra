---
"@stackra/realtime": minor
"@stackra/collaboration": patch
---

Realtime subscribe and room tokens now work across a service's instances.

- **Signed tokens:** set the new `REALTIME_TOKEN_KEY` secret (`tokenKey`, at least 32 bytes) and tokens are signed. Any instance can verify one, and the new `RealtimeTokenLedger` port lets each be redeemed only once.
  - Use its `valkey` driver (`tokenLedger: "valkey"`, `./node`, on the fan-out's `REALTIME_VALKEY_URL`) when a service runs more than one instance. A token captured from a URL then can't be replayed within its lifetime.
  - With no key set, tokens stay in the issuing process, as before.
- **Breaking: these calls now return Promises.** `RealtimeHub.issueToken` and `join`; `RealtimeRooms.issueToken`, `join`, `accept` and `stream`; and the drivers' `open`, `accept` and `connect`. The hub and rooms constructors take the ledger.
- **`recheckEdit` on another instance:** a grant's `recheckEdit` is a closure, so it applies only on the instance that issued the token. Redeemed elsewhere, `mayEdit` holds until the token expires.

Bump step: await these calls. For a service on more than one instance, set `REALTIME_TOKEN_KEY` and `config.realtime.tokenLedger: valkey`.

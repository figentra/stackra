---
"@stackra/runway": minor
---

A service runway environment takes an `events` block for the cross-app event relay (ADR 0511, amendment of
2026-11-02, STA-1910): `signingKey`, the secret name of the producer's signing key (default
`STACKRA_EVENTS_SIGNING_KEY`, never a value); `keys`, its public keys, current first; and `subscribers`, each consumer's
member key, inbox origin (`https`, or `http` to a loopback host) and the event wire names it takes. `schema/service.json`
describes it.

---
"@stackra/integrations": patch
---

A provider's error code no longer carries a credential into `ProviderRefusedError`. The managed client and
`requestToken` replace a code that equals or contains a value the call sent with `"[redacted]"`. For the managed client
that means a connection's or an Integration's `@Secret` value, a placeholder value filled into the auth, the Basic
credential, the signed JWT or the OAuth bearer; for `requestToken`, the client secret or a grant's code, verifier, refresh
token or assertion. `providerCodeOf` now takes only letters, digits, `_`, `.` and `-`, at most 64 characters.

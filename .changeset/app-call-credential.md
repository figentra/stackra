---
"@stackra/app": minor
---

`CallAuthData` may carry the verified API key's `credential` (`CallAuthCredential`), and `serveGuardedCall` passes it to `execute` as a fourth argument, so a generated adapter can read the key's version pin.

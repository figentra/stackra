---
"@stackra/errors": patch
"@stackra/fiscal": patch
"@stackra/infra-identity": patch
"@stackra/integrations": patch
"@stackra/logger": patch
"@stackra/webhooks": patch
---

Published tarballs no longer hold the packages' own tests (STA-2917). Every `@stackra/*` package shipped `src` with
its `__tests__` folders: 5,641 test files in 0.33.1, about 18.6 MB of the 106.6 MB unpacked, and the fake private
keys, JWTs and payment keys in the tests of these six packages made consumers' secret scanners (Trivy, GitHub secret
scanning of vendored code) report them as leaked credentials. The workspace pack hook now leaves `__tests__`,
`__fixtures__`, `__snapshots__`, `__mocks__` and `*.test.*`, `*.spec.*`, `*.test-d.*` and `*.bench.*` files out of
every tarball, and refuses to pack a file that would still be a test or hold a secret-shaped string. The
`@stackra/webhooks` `signingKey` example no longer writes out a sample `whsec_` secret.

Compatibility: no export changes. `src` still ships for source maps; only test files leave the tarball, and nothing
under `exports` pointed at them.

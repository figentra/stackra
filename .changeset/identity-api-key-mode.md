---
"@stackra/identity": minor
---

An API key has a mode, test or live, written into its text after the kind's prefix (`stackra_sk_test_…`).
`mintApiKey(kind, config, mode)` takes it (live by default), `parseApiKey` and `VerifiedApiKey` answer it, and a key
minted before modes reads as live. `ApiKeyRecord` gains `mode` and `versionPin`; the verifier refuses a key whose text
names another mode than its record. New `ApiKeyMode` enum in `./contracts`.

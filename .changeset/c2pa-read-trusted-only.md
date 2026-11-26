---
"@stackra/media": minor
---

The `c2pa` content-credentials driver no longer presents an untrusted signer's credential as verified (STA-2791, CTO decision of 2026-11-25). `ContentCredentials.read` now answers `null` for an image with no manifest, or a `ContentCredentialReading`: `{ trust: "trusted", credential }` only when c2pa-rs validates the manifest and its signer chains to an allowed anchor, `{ trust: "unverified", credential }` when the manifest validates but the signer is on no trust list (a self-made or unknown CA, which the driver returned as a plain credential before), and `{ trust: "invalid" }` when it does not validate (an image changed after signing, which was `null` before). New `ContentCredentialTrust` enum and `ContentCredentialReading` type in `@stackra/media/contracts`.

The anchors are the official C2PA trust list, pinned in the package from `c2pa-org/conformance-public` (commit `c68494b5`, SHA-256 checked by a test) and never fetched at run time, plus our own signing certificates: the configured signing certificate and the new `media.c2pa.trustedSigners` (public PEM certificates kept after a rotation; default empty). The read fails closed: expired anchors and signers are dropped, and with no usable anchor nothing is `trusted`. It also no longer fetches a remote manifest or an OCSP answer while reading.

Breaking for callers of `ContentCredentials.read` (it returned `ContentCredential | null`): read `reading.credential` after checking `reading.trust`, and show a credential as genuine only when `trust` is `trusted`. Breaking for anyone implementing the port: `read` returns `Promise<ContentCredentialReading | null>`.

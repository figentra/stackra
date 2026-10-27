---
"@stackra/integrations": minor
---

Wallet pass issuing (ADR 0348 decision 5, STA-791). `./contracts` adds the `CmsSigner` host port (a detached CMS
SignedData signature). A new `./node` entry adds `PkijsCmsSignerDriver` (pkijs and Web Crypto, certificate, key and
chain read by secret name, `APPLE_WALLET_SIGNER_SECRETS`), the `WalletPassIssuer` port with `WalletPassRequest` and
`IssuedWalletPass`, `AppleWalletPassDriver` (`applePassJson`, `buildPkpass`: pass.json, brand-kit images, SHA-1
manifest, signature, zip) and `GoogleWalletPassDriver` (`googleWalletObject`; the generic object written through the
Google Wallet Integration's JWT bearer `api`, insert or update, and an RS256 save link). New dependencies:
`@stackra/data-transfer`, `pkijs`, `asn1js` (catalog entries for the integration batch).

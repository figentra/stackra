---
"@stackra/consent": minor
"@stackra/actions": minor
---

Server-side consent (ADR 0472). `@stackra/consent` adds the signed, short-lived `ConsentSnapshot`:
`ConsentLedger.snapshotRequest` (what the client sends), `ConsentSnapshotIssuer` (re-applies the rules and signs
through the `Signer` port), `ConsentSnapshotVerifier` (key, signature, lifetime, policy version, Global Privacy
Control), the `ConsentSnapshotKeys` port with `signer` and `static` drivers, `SnapshotConsentCheckDriver`, the
`CONSENT_SNAPSHOT_HEADER` (`Stackra-Consent`) and the `snapshotLifetimeMinutes` and `snapshotClockSkewSeconds`
settings. `@stackra/actions` adds `CallOptions.consentSnapshot`, `ctx.consent()` verified once per call through the new
`ConsentCheck` port (`CallConsent`, `ConsentRefusal`), refused without a snapshot or a bound check and never refusing
the call, and the `grantedConsent` test helper.

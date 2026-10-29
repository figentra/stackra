---
"@stackra/consent": minor
"@stackra/actions": minor
---

The consent snapshot travels (ADR 0472). `@stackra/actions` adds `requestCallOptions(request)`, which a generated
endpoint spreads beside the verified actor to lift `Idempotency-Key` onto `idempotencyKey` and `Stackra-Consent` onto
`consentSnapshot`, as sent, and `CALL_HEADERS` (`./contracts`) naming both. `@stackra/consent` adds the consent
endpoint in a new `./node` entry: `IssueConsentSnapshotAction` (`POST /consent/snapshots`,
`consent.consent_snapshot.issue@1`, public, for anonymous visitors and users) with its input and output and
`ConsentSnapshotPermissions.issue` (L0); `CONSENT_SNAPSHOT_PATH`; and the client half, `consentSnapshotHeaders`, which
fetches a snapshot of `ledger.snapshotRequest()`, refreshes it when the decision changes or nears expiry, and answers
the `Stackra-Consent` header for a session's `headers()`. `CONSENT_SNAPSHOT_HEADER` is now `CALL_HEADERS.consentSnapshot`.

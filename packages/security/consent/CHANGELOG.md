# @stackra/consent

## 0.1.0

### Minor Changes

- fadd825: Consent evidence records (ADR 0454): `ConsentProofService.evidence(subject, document?)` returns a subject's proofs
  oldest first, each with who gave it, on whose behalf, the version and when.
- 0c46afb: Add `ConsentCategory.Marketing` for ads, pixels, conversions and audiences; the opt-in regimes `lgpd`, `pdpl_sa`,
  `pdpl_ae` and `dpdp` beside `gdpr` and `ccpa`; `consentModeSignals` (Google Consent Mode v2 from the ledger); and the
  `RegionSource` port (`./contracts`) with the Cloudflare `cf-ipcountry` driver, whose region the host feeds to
  `ConsentLedger.setRegion`. Labels in all seven locales.
- 2787c1e: Add `@stackra/consent`, visitor consent per ADR 0298: decline by default, Global Privacy Control refuses, and the
  decision stored with the policy version it answered. `.` ships the `ConsentConfig` configuration (`consent`:
  `categories`, `cookieName`, `expiryDays`, `policyVersion`, `regionDefaults`, `askOnFirstLaunch`) with its shipped schema
  `ConsentConfig$` and shape `ConsentOptions`; the `ConsentCategory`, `ConsentStatus` and `ConsentRegime` enums; the
  `ConsentLedger` service (`status`, `isGranted`, `isRequired`, `set`, `reset`, `setRegion`, `subscribe`, `revision`);
  and the `CookieConsentStoreDriver`, `StorageConsentStoreDriver` and `MemoryConsentStoreDriver` drivers. `./contracts`
  ships the `ConsentStore` port and the `ConsentRecord` type, `./react` the `useConsent` hook (one category for a banner,
  every category for a settings page; no decision state in a server render), and `./testing` the `fakeConsent` helper.
- 2e21e6a: Add the French, German, Spanish, Italian and Dutch `consent` catalogues (STA-788, ADR 0403).
- 99665bb: Server-side consent (ADR 0472). `@stackra/consent` adds the signed, short-lived `ConsentSnapshot`:
  `ConsentLedger.snapshotRequest` (what the client sends), `ConsentSnapshotIssuer` (re-applies the rules and signs
  through the `Signer` port), `ConsentSnapshotVerifier` (key, signature, lifetime, policy version, Global Privacy
  Control), the `ConsentSnapshotKeys` port with `signer` and `static` drivers, `SnapshotConsentCheckDriver`, the
  `CONSENT_SNAPSHOT_HEADER` (`Stackra-Consent`) and the `snapshotLifetimeMinutes` and `snapshotClockSkewSeconds`
  settings. `@stackra/actions` adds `CallOptions.consentSnapshot`, `ctx.consent()` verified once per call through the new
  `ConsentCheck` port (`CallConsent`, `ConsentRefusal`), refused without a snapshot or a bound check and never refusing
  the call, and the `grantedConsent` test helper.
- 8ead1a8: The consent snapshot travels (ADR 0472). `@stackra/actions` adds `requestCallOptions(request)`, which a generated
  endpoint spreads beside the verified actor to lift `Idempotency-Key` onto `idempotencyKey` and `Stackra-Consent` onto
  `consentSnapshot`, as sent, and `CALL_HEADERS` (`./contracts`) naming both. `@stackra/consent` adds the consent
  endpoint in a new `./node` entry: `IssueConsentSnapshotAction` (`POST /consent/snapshots`,
  `consent.consent_snapshot.issue@1`, public, for anonymous visitors and users) with its input and output and
  `ConsentSnapshotPermissions.issue` (L0); `CONSENT_SNAPSHOT_PATH`; and the client half, `consentSnapshotHeaders`, which
  fetches a snapshot of `ledger.snapshotRequest()`, refreshes it when the decision changes or nears expiry, and answers
  the `Stackra-Consent` header for a session's `headers()`. `CONSENT_SNAPSHOT_HEADER` is now `CALL_HEADERS.consentSnapshot`.
- 0ee0d06: Add versioned terms acceptance and server consent proofs (`ConsentProofService` over the new `ConsentProofStore` and
  `ConsentAuthority` ports, `MemoryConsentProofStoreDriver`, `TermsDocument`), consent given by one party on behalf of
  another with its relationship and policy version (`answerFor`, `ConsentAuthorityMissingError`,
  `needsGuardianConsent`), and the `./ui` entry with `ConsentBanner`, `ConsentPreferences`, `LegalPage` and
  `TermsPrompt` on `@stackra/ui`, with English and Arabic texts.
- 48e9fed: The consent verification method port (STA-1323, review A2-2): `ConsentVerifier` with `ConsentVerificationMethod` (card
  check, signed form, guardian login), `ConsentVerificationRequest` and `ConsentVerification` in `./contracts`.
  `ConsentProofService.answerFor` takes the method the market pack names with the flow's evidence and records the proof,
  with `verificationMethod` and `verificationReference`, only once the verifier passes it; otherwise it refuses with
  `ConsentNotVerifiedError`. `ConsentProofService` now takes a `ConsentVerifier`; the package ships the fail-closed
  `NoneConsentVerifierDriver`.
- 3a94a6e: Follow the phone's system-owned settings (STA-1536): the `SystemSettings` port with its memory driver and the abstract
  `ExpoSystemSettingsDriver` (App Tracking Transparency, Low Power Mode, an expensive connection, background refresh and
  the settings deep link), `createNotificationChannels` for one Android channel per category, `OutboundPush.channelId`,
  and `ConsentLedger.setAppTrackingDenied`, which refuses marketing on the client and in the signed snapshot.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.

### Patch Changes

- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [dfa0c6a]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [ca44233]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [1271b88]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

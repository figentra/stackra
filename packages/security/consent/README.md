<!--
Stackra file contract:
Purpose: the README of @stackra/consent: visitor consent, server consent proofs, consent for another and its
         verification method, the signed consent snapshot that reaches the server, the entries and how a host uses them.
Boundary: documentation only; the rules for agents are in AGENTS.md.
Runtime: none (Markdown)
Governing contract: ADR 0298; ADR 0454; ADR 0472; OS-284; STA-1323.
-->

# @stackra/consent

Visitor consent for Stackra surfaces (ADR 0298): nothing optional runs until the visitor decides, a browser sending
Global Privacy Control has refused, and the decision is stored with the policy version it answered, so a new version
asks again.

**Tier:** `tier:lib` (`packages/security/consent`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/actions` (its `./contracts` only: the `ConsentCheck` port), `@stackra/config`, `@stackra/container`,
`@stackra/contracts`, `@stackra/storage`, `@stackra/support`, `@stackra/validation` and zod; React
is an optional peer of `./react`.

## What is here

| Entry         | Symbol                                                                                              | Use                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.`           | `ConsentConfig`                                                                                     | the configuration (key `consent`): categories, cookie, expiry, policy version, regions                       |
| `.`           | `ConsentConfig$`                                                                                    | the shipped schema a member's generated override extends                                                     |
| `.`           | `ConsentCategory`                                                                                   | `necessary`, `analytics`, `crash_replay`, `marketing` (ads, pixels, conversions, audiences)                  |
| `.`           | `ConsentStatus`                                                                                     | `granted`, `denied`, `undecided`                                                                             |
| `.`           | `ConsentRegime`                                                                                     | `ccpa` (opt-out); `gdpr`, `lgpd`, `pdpl_sa`, `pdpl_ae`, `dpdp` (opt-in), per region in `regionDefaults`      |
| `.`           | `ConsentLedger`                                                                                     | the service that decides: `status`, `isGranted`, `set`, `reset`, `setRegion`, `subscribe`, `snapshotRequest` |
| `.`           | `CookieConsentStoreDriver`                                                                          | the web store: the one decision cookie                                                                       |
| `.`           | `StorageConsentStoreDriver`                                                                         | the device store: `consent.decision` in the `prefs` area                                                     |
| `.`           | `MemoryConsentStoreDriver`                                                                          | tests and previews                                                                                           |
| `./contracts` | `ConsentStore`                                                                                      | the port the drivers implement (`read`, `write`, `clear`)                                                    |
| `./contracts` | `RegionSource`                                                                                      | reads the visitor's region from request headers (`regionOf`), for `setRegion`                                |
| `.`           | `CfIpcountryRegionSourceDriver`                                                                     | the `cf-ipcountry` region source: Cloudflare's country header; `XX` and `T1` read as unknown                 |
| `.`           | `consentModeSignals`, `ConsentModeSignals`                                                          | Google Consent Mode v2: `ad_*` follow `marketing`, `analytics_storage` follows `analytics`                   |
| `./react`     | `useConsent`                                                                                        | `useConsent(category)` for a banner, `useConsent()` for a settings page                                      |
| `./testing`   | `fakeConsent`                                                                                       | a real ledger over memory, nothing decided                                                                   |
| `.`           | `ConsentProofService`                                                                               | server proofs: `pending` terms by version, `answer`, `answerFor` another, `current`, `evidence`              |
| `.`           | `MemoryConsentProofStoreDriver`, `TermsDocument`, `ConsentAuthorityMissingError`                    | the memory proof store, a versioned document, the refusal                                                    |
| `.`           | `needsGuardianConsent`                                                                              | whether a birth date is below an age of consent (the age is market-pack data)                                |
| `.`           | `NoneConsentVerifierDriver`, `ConsentNotVerifiedError`                                              | the default verifier (fails every method closed); the refusal of a failed verification                       |
| `./contracts` | `ConsentVerifier`, `ConsentVerificationMethod`, `ConsentVerificationRequest`, `ConsentVerification` | the verification method port, its methods (card check, signed form, guardian login), request and answer      |
| `./contracts` | `ConsentProofStore`, `ConsentAuthority`, `ConsentProof`                                             | the append-only proof store; who may consent for whom                                                        |
| `.`           | `ConsentSnapshotIssuer`, `IssuedConsentSnapshot`                                                    | the server half of the consent endpoint: re-applies the rules to the client's record, signs a snapshot       |
| `.`           | `ConsentSnapshotVerifier`                                                                           | checks a snapshot token: key, signature, lifetime, policy version, Global Privacy Control                    |
| `.`           | `SnapshotConsentCheckDriver`                                                                        | the `ConsentCheck` driver of `@stackra/actions`: `ctx.consent()` verifies the call's snapshot                |
| `.`           | `SignerConsentSnapshotKeysDriver`, `StaticConsentSnapshotKeysDriver`                                | trusted keys: the bound `Signer`'s own, or a fixed list (a Worker, a key rotation)                           |
| `./contracts` | `ConsentSnapshot`, `ConsentSnapshotRequest`, `ConsentSnapshotKeys`, `CONSENT_SNAPSHOT_HEADER`       | the signed payload, what the client sends to get one, the trusted-keys port, the `Stackra-Consent` header    |
| `./ui`        | `ConsentBanner`, `ConsentPreferences`                                                               | the cookie banner (accept all, reject all, manage) and the category switches                                 |
| `./ui`        | `LegalPage`, `TermsPrompt`                                                                          | one legal text (plain paragraphs); versioned terms acceptance                                                |

## Terms, proofs and consent for another

The visitor's cookie decision proves nothing on the server. Versioned terms and purpose consents are proofs:
`ConsentProofService.pending(user, documents)` lists the documents whose current version the person has not accepted;
`answer` appends their acceptance or refusal with the text's hash; `answerFor(child, parent, document, granted)` appends
a consent given for someone else after `ConsentAuthority` confirms the relationship, which is stored with the proof.
The texts, versions and required documents come from the OS compliance service per market; the age of consent comes
from the market pack (`needsGuardianConsent(birthDate, today, age)`).

Each proof is a consent evidence record (ADR 0454): who it is about (`subject`), who gave it (`givenBy`), on whose
behalf (`relationship`), the document and version, the text's hash, the answer, when (`at`) and where (`channel`).
`evidence(subject, document?)` returns the subject's trail oldest first, as written, for the person or a regulator.

## Verifying a consent for another (STA-1323)

Some markets require more than the relationship record before a guardian's consent counts: a card check, a signed form
or the guardian signing in (review A2-2). Which method applies is market-pack data; the caller reads it and passes it
with the evidence the method's flow produced:

```ts
const method = valueOf(pack, "consent.guardian_verification", today)?.value as
  ConsentVerificationMethod | undefined;
await proofs.answerFor(
  child.id,
  parent.id,
  PHOTOS,
  true,
  "kiosk",
  method && { method, evidence: authorisation.id },
);
```

`ConsentVerifier` (`./contracts`) checks it; the services that run the methods implement it and a host binds its class
with `@Replaces(ConsentVerifier)`. The proof stores the method and the verifier's reference (`verificationMethod`,
`verificationReference`), never input. A failed check refuses with `ConsentNotVerifiedError` and writes nothing. The
package ships only `NoneConsentVerifierDriver`, which fails every method closed, so a market that requires verification
is never recorded unverified. With no method named, the relationship alone suffices, as before.

## The rules, in order

1. A required category (`necessary`) is granted, never asked and never stored.
2. Global Privacy Control refuses every other category.
3. On a phone, an App Tracking Transparency refusal refuses `marketing` (ADR 0298, 2026-10-29 note). The host reads
   it from `SystemSettings.tracking()` (`@stackra/platform`) and calls `ledger.setAppTrackingDenied(...)` at launch
   and on each return to the foreground; the stored choice is kept for when the person allows tracking, and the
   snapshot request carries `appTrackingDenied` so the server refuses marketing too.
4. A stored decision counts when it answers the current `policyVersion` and is younger than `expiryDays`.
5. Otherwise the visitor's region decides: `ccpa` grants a category marked `defaultGranted`; every opt-in regime
   (`gdpr`, `lgpd`, `pdpl_sa`, `pdpl_ae`, `dpdp`), or no regime at all, leaves it undecided, which runs nothing.

## Region and Consent Mode

Where the request is seen (the edge, a server render), read the region and hand it to the ledger; behind Cloudflare
the `cf-ipcountry` driver reads the country header:

```ts
ledger.setRegion(regionSource.regionOf(request.headers)); // "SA", or null for unknown (the `default` regime)
```

A page that loads Google tags passes the ledger's answer on; anything not granted is `denied`:

```ts
gtag("consent", "update", consentModeSignals(ledger));
```

## The consent snapshot (ADR 0472)

The decision still lives in the browser, but sends that start on a server (server analytics, conversion APIs, the
ingest Worker, audience sync) need it too. The client asks the consent endpoint for a signed, short-lived copy and sends
it with every API call in the `Stackra-Consent` header (`CONSENT_SNAPSHOT_HEADER`):

```ts
// client: when the decision changes, and before the copy expires
const request = ledger.snapshotRequest(anonymousId); // the stored record as kept, GPC, the region
// server: the consent endpoint
const { token, snapshot } = await issuer.issue(request, signedInUserId);
```

The issuer trusts nothing the client says: it parses the record, applies the rules below (an outdated or expired
decision grants nothing optional, GPC refuses every optional category, an unlisted category is ignored), binds the
subject (the anonymous id when analytics is granted, else the principal, else a random id) and signs through the
`Signer` port. A snapshot lives `snapshotLifetimeMinutes` (default a day), never past the decision's expiry.

On the server, bind `SnapshotConsentCheckDriver` for the `ConsentCheck` port of `@stackra/actions` and a
`ConsentSnapshotKeys` driver; a handler reads `await ctx.consent()`. A missing, malformed, untrusted, wrongly signed,
not yet valid (beyond `snapshotClockSkewSeconds`), expired or outdated snapshot, or one that records GPC, reads as
refused with nothing granted. Reading it never refuses the call; a sender checks `granted.includes(category)`.
Person-level evidence (an audience upload keyed by email, a guardian's approval) stays with `ConsentProofService`.

## Use

```ts
import {
  ConsentCategory,
  ConsentConfig as BaseConsentConfig,
  ConsentRegime,
} from "@stackra/consent";

export class ConsentConfig extends BaseConsentConfig {
  override categories: BaseConsentConfig["categories"] = [
    {
      category: ConsentCategory.Necessary,
      required: true,
      defaultGranted: true,
      descriptionKey: null,
    },
    {
      category: ConsentCategory.Analytics,
      required: false,
      defaultGranted: false,
      descriptionKey: null,
    },
  ];
  override policyVersion = "2026-10";
  override regionDefaults: Record<string, ConsentRegime> = { default: ConsentRegime.Gdpr };
}
```

```tsx
const analytics = useConsent(ConsentCategory.Analytics);
if (!analytics.isLoaded || analytics.status !== ConsentStatus.Undecided) return null;
```

`isLoaded` is `false` in a server render and during hydration: shared HTML never carries decision state, and no HTML
response sets the cookie. The analytics package watches the same ledger to send or drop its queued events.

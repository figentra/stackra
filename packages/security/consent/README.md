# @stackra/consent

Visitor consent for Stackra surfaces (ADR 0298): nothing optional runs until the visitor decides, a browser sending
Global Privacy Control has refused, and the decision is stored with the policy version it answered, so a new version
asks again.

**Tier:** `tier:lib` (`packages/security/consent`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`, `@stackra/validation` and zod; React
is an optional peer of `./react`.

## What is here

| Entry         | Symbol                                                                           | Use                                                                                             |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.`           | `ConsentConfig`                                                                  | the configuration (key `consent`): categories, cookie, expiry, policy version, regions          |
| `.`           | `ConsentConfig$`                                                                 | the shipped schema a member's generated override extends                                        |
| `.`           | `ConsentCategory`                                                                | `necessary`, `analytics`, `crash_replay`                                                        |
| `.`           | `ConsentStatus`                                                                  | `granted`, `denied`, `undecided`                                                                |
| `.`           | `ConsentRegime`                                                                  | `gdpr` (opt-in) and `ccpa` (opt-out), per region in `regionDefaults`                            |
| `.`           | `ConsentLedger`                                                                  | the service that decides: `status`, `isGranted`, `set`, `reset`, `setRegion`, `subscribe`       |
| `.`           | `CookieConsentStoreDriver`                                                       | the web store: the one decision cookie                                                          |
| `.`           | `StorageConsentStoreDriver`                                                      | the device store: `consent.decision` in the `prefs` area                                        |
| `.`           | `MemoryConsentStoreDriver`                                                       | tests and previews                                                                              |
| `./contracts` | `ConsentStore`                                                                   | the port the drivers implement (`read`, `write`, `clear`)                                       |
| `./react`     | `useConsent`                                                                     | `useConsent(category)` for a banner, `useConsent()` for a settings page                         |
| `./testing`   | `fakeConsent`                                                                    | a real ledger over memory, nothing decided                                                      |
| `.`           | `ConsentProofService`                                                            | server proofs: `pending` terms by version, `answer`, `answerFor` another, `current`, `evidence` |
| `.`           | `MemoryConsentProofStoreDriver`, `TermsDocument`, `ConsentAuthorityMissingError` | the memory proof store, a versioned document, the refusal                                       |
| `.`           | `needsGuardianConsent`                                                           | whether a birth date is below an age of consent (the age is market-pack data)                   |
| `./contracts` | `ConsentProofStore`, `ConsentAuthority`, `ConsentProof`                          | the append-only proof store; who may consent for whom                                           |
| `./ui`        | `ConsentBanner`, `ConsentPreferences`                                            | the cookie banner (accept all, reject all, manage) and the category switches                    |
| `./ui`        | `LegalPage`, `TermsPrompt`                                                       | one legal text (plain paragraphs); versioned terms acceptance                                   |

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

## The rules, in order

1. A required category (`necessary`) is granted, never asked and never stored.
2. Global Privacy Control refuses every other category.
3. A stored decision counts when it answers the current `policyVersion` and is younger than `expiryDays`.
4. Otherwise the visitor's region decides: `ccpa` grants a category marked `defaultGranted`; `gdpr`, or no regime at
   all, leaves it undecided, which runs nothing.

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

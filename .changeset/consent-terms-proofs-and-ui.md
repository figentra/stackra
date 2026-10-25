---
"@stackra/consent": minor
---

Add versioned terms acceptance and server consent proofs (`ConsentProofService` over the new `ConsentProofStore` and
`ConsentAuthority` ports, `MemoryConsentProofStoreDriver`, `TermsDocument`), consent given by one party on behalf of
another with its relationship and policy version (`answerFor`, `ConsentAuthorityMissingError`,
`needsGuardianConsent`), and the `./ui` entry with `ConsentBanner`, `ConsentPreferences`, `LegalPage` and
`TermsPrompt` on `@stackra/ui`, with English and Arabic texts.

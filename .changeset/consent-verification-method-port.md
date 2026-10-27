---
"@stackra/consent": minor
---

The consent verification method port (STA-1323, review A2-2): `ConsentVerifier` with `ConsentVerificationMethod` (card
check, signed form, guardian login), `ConsentVerificationRequest` and `ConsentVerification` in `./contracts`.
`ConsentProofService.answerFor` takes the method the market pack names with the flow's evidence and records the proof,
with `verificationMethod` and `verificationReference`, only once the verifier passes it; otherwise it refuses with
`ConsentNotVerifiedError`. `ConsentProofService` now takes a `ConsentVerifier`; the package ships the fail-closed
`NoneConsentVerifierDriver`.

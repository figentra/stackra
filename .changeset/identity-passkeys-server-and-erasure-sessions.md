---
"@stackra/identity": minor
---

Add the server half of passkeys and end an erased subject's sessions (STA-1538, STA-1543). `IdpAdmin` gains
`findUserId` (the provider user of a `usr_` id, kept as the `stackra_user_id` metadata `createUser` now writes from
`IdpUserInput.stackraUserId`), `startPasskeySignIn` and `finishPasskeySignIn` (a ZITADEL v2 session with a `webAuthN`
challenge and its check) and `startPasskeyRegistration` and `finishPasskeyRegistration` (the v2 user passkey
endpoints); the ZITADEL and memory drivers implement them. A custom `IdpAdmin` driver must implement the five new
methods. The new `./node` entry ships `ChallengePasskeyAction`, `VerifyPasskeyAction`, `RegisterPasskeyAction` and
`ConfirmPasskeyAction` with `PasskeyPermissions` and their schemas, and `EndErasedSubjectSessionsListener`, which ends
every provider session of the subject of @stackra/privacy's `SubjectErased`. `signInWithPasskey` and `registerPasskey`
in `.` wire a `Passkeys` driver (`ExpoPasskeysDriver` on a phone) to those actions.

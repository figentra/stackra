---
"@stackra/identity": minor
"@stackra/showcase": patch
---

The identity kit's web blocks (ADR 0504) in `@stackra/identity/react`: `SessionGate` (shows content to a signed-in
user at the assurance level asked for), `AccountMenu`, `StepUpDialog` (runs the existing `stepUpSignIn`),
`PasswordPolicyChecklist`, `PasswordReset`, `SignUp` and `SecurityPage`. The new `AccountSecurity` client port in
`./contracts` feeds the security page (passkeys, second factors, device sessions, password), with
`MemoryAccountSecurityDriver` in `./testing`; a refused change opens the step-up dialog and retries. The session user
now carries the `assurance` level its sign-in reached. Every word comes from the host in `labels`; the showcase lists
the seven blocks under Blocks.

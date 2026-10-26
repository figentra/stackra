---
"@stackra/platform": minor
---

Add the `./node` entry: `TurnstileCaptchaVerifierDriver`, the same class `./worker` exports, so a Node service (OS
security-center, OS-366) binds the Turnstile `CaptchaVerifier` driver without importing the Worker entry. `./worker` is
unchanged.
